const http = require("http")
const { Server } = require("socket.io")
const express = require("express")
const cors = require("cors")

// Create Express app
const app = express()
app.use(cors())

// Add a health check endpoint for Render
app.get("/", (req, res) => {
  res.status(200).send("Socket.IO server is running")
})

app.get("/health", (req, res) => {
  res.status(200).send("OK")
})

// Create HTTP server with Express
const server = http.createServer(app)

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    // Allow connections from your frontend domain
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  // Enable WebSocket transport
  transports: ["websocket", "polling"]
})

// Constants
const WAITING_TIME = 20000 // 20 seconds in milliseconds
const MAX_PLAYERS = 100
const MAX_GAME_TIME = 5 * 60 * 1000 // 5 minutes in milliseconds

// Store active game sessions
const gameSessions = new Map()

// Function to start game countdown
function startGameCountdown(sessionId) {
  const session = gameSessions.get(sessionId)
  if (!session) return

  session.countdownTimer = WAITING_TIME
  session.status = "countdown"

  // Emit initial countdown value
  io.to(sessionId).emit("countdown_update", session.countdownTimer / 1000)

  // Start countdown interval
  const countdownInterval = setInterval(() => {
    if (!gameSessions.has(sessionId)) {
      clearInterval(countdownInterval)
      return
    }

    const currentSession = gameSessions.get(sessionId)
    currentSession.countdownTimer -= 1000

    // Emit countdown update
    io.to(sessionId).emit("countdown_update", currentSession.countdownTimer / 1000)

    // When countdown reaches 0, start the game
    if (currentSession.countdownTimer <= 0) {
      clearInterval(countdownInterval)
      currentSession.status = "playing"
      currentSession.startTime = Date.now()
      currentSession.gameTimer = MAX_GAME_TIME

      // Start game timer
      startGameTimer(sessionId)

      // Emit game start event
      io.to(sessionId).emit("game_start", {
        isMultiplayer: currentSession.players.length > 1,
        players: currentSession.players
      })
    }
  }, 1000)

  session.countdownIntervalId = countdownInterval
}

// Function to start game timer
function startGameTimer(sessionId) {
  const session = gameSessions.get(sessionId)
  if (!session) return

  const gameInterval = setInterval(() => {
    if (!gameSessions.has(sessionId)) {
      clearInterval(gameInterval)
      return
    }

    const currentSession = gameSessions.get(sessionId)
    currentSession.gameTimer -= 1000

    // Emit game timer update
    io.to(sessionId).emit("game_timer", currentSession.gameTimer / 1000)

    // When game timer reaches 0, end the game
    if (currentSession.gameTimer <= 0) {
      clearInterval(gameInterval)
      endGame(sessionId)
    }
  }, 1000)

  session.gameIntervalId = gameInterval
}

// Function to end game
function endGame(sessionId) {
  const session = gameSessions.get(sessionId)
  if (!session) return

  session.status = "finished"
  session.endTime = Date.now()

  // Sort players by score and time
  const sortedPlayers = [...session.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.timeElapsed - b.timeElapsed
  })

  io.to(sessionId).emit("game_finished", sortedPlayers)
}

// Function to find or create available session
function findOrCreateSession() {
  // Look for an available waiting or countdown session
  for (const [sessionId, session] of gameSessions.entries()) {
    if ((session.status === "waiting" || session.status === "countdown") && 
        session.players.length < MAX_PLAYERS) {
      return sessionId;
    }
  }

  // Create new session if no available session found
  const newSessionId = `session_${Date.now()}`;
  gameSessions.set(newSessionId, {
    id: newSessionId,
    players: [],
    status: "waiting",
    countdownTimer: null,
    gameTimer: null,
    countdownIntervalId: null,
    gameIntervalId: null
  });

  return newSessionId;
}

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Handle player joining
  socket.on("join_game", ({ playerName }) => {
    try {
      const sessionId = findOrCreateSession()
      const session = gameSessions.get(sessionId)

      // Check if game already started
      if (session.status === "playing") {
        // Create new session for this player
        const newSessionId = findOrCreateSession()
        session = gameSessions.get(newSessionId)
      }

      // Add player to session
      const player = {
        id: socket.id,
        name: playerName,
        score: 0,
        incorrectCount: 0,
        isReady: false,
        isFinished: false
      }

      session.players.push(player)

      // Join the socket room for this session
      socket.join(sessionId)
      socket.sessionId = sessionId

      // Send updated player list to all clients in this session
      io.to(sessionId).emit("players_updated", session.players)

      // If this is the first player, start the countdown
      if (session.players.length === 1) {
        startGameCountdown(sessionId)
      }
    } catch (error) {
      console.error("Error in join_game:", error)
      socket.emit("error", "Failed to join game")
    }
  })

  // Handle answer submission
  socket.on("submit_answer", ({ answer, timeElapsed }) => {
    try {
      if (!socket.sessionId) return

      const session = gameSessions.get(socket.sessionId)
      if (!session || session.status !== "playing") return

      const playerIndex = session.players.findIndex((p) => p.id === socket.id)
      if (playerIndex === -1) return

      // Update player score and stats
      const player = session.players[playerIndex]
      if (answer.isCorrect) {
        player.score += 1
      } else {
        player.incorrectCount += 1
      }
      player.timeElapsed = timeElapsed

      // Emit updated player list
      io.to(socket.sessionId).emit("players_updated", session.players)
    } catch (error) {
      console.error("Error in submit_answer:", error)
    }
  })

  // Handle player disconnect
  socket.on("disconnect", () => {
    try {
      if (!socket.sessionId) return

      const session = gameSessions.get(socket.sessionId)
      if (!session) return

      // Remove player from session
      session.players = session.players.filter((p) => p.id !== socket.id)

      // If no players left, clean up the session
      if (session.players.length === 0) {
        if (session.countdownIntervalId) {
          clearInterval(session.countdownIntervalId)
        }
        if (session.gameIntervalId) {
          clearInterval(session.gameIntervalId)
        }
        gameSessions.delete(socket.sessionId)
      } else {
        // Notify remaining players
        io.to(socket.sessionId).emit("players_updated", session.players)
      }

      console.log(`User disconnected: ${socket.id}`)
    } catch (error) {
      console.error("Error in disconnect handler:", error)
    }
  })
})

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error)
})

// Start the server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
})

