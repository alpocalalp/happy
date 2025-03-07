const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")

// Create HTTP server
const server = http.createServer()

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

// Constants
const MAX_PLAYERS = 100
const WAITING_TIME = 20 * 1000 // 20 seconds
const MAX_GAME_TIME = 5 * 60 * 1000 // 5 minutes

// Store active game sessions
const gameSessions = new Map()

// Generate a random session ID
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 9)
}

// Find or create available session
const findOrCreateSession = () => {
  // Look for an available waiting session
  for (const [id, session] of gameSessions) {
    if (session.status === "waiting" && session.players.length < MAX_PLAYERS) {
      return session
    }
  }

  // Create new session if no available session found
  const sessionId = generateSessionId()
  const newSession = {
    id: sessionId,
    players: [],
    status: "waiting",
    waitingTimer: null,
    gameTimer: null,
  }
  gameSessions.set(sessionId, newSession)
  return newSession
}

// Start waiting timer for a session
const startWaitingTimer = (sessionId) => {
  const session = gameSessions.get(sessionId)
  if (!session) return

  let timeLeft = WAITING_TIME

  // Clear existing timer if any
  if (session.waitingTimer) {
    clearInterval(session.waitingTimer)
  }

  // Start new timer
  session.waitingTimer = setInterval(() => {
    timeLeft -= 1000

    // Notify clients about remaining time
    io.to(sessionId).emit("waiting_timer", timeLeft)

    // When timer ends
    if (timeLeft <= 0) {
      clearInterval(session.waitingTimer)
      startGame(sessionId)
    }
  }, 1000)
}

// Start game for a session
const startGame = (sessionId) => {
  const session = gameSessions.get(sessionId)
  if (!session) return

  session.status = "playing"
  session.startTime = Date.now()
  
  // Start game timer
  let timeLeft = MAX_GAME_TIME

  if (session.gameTimer) {
    clearInterval(session.gameTimer)
  }

  session.gameTimer = setInterval(() => {
    timeLeft -= 1000

    // Notify clients about remaining time
    io.to(sessionId).emit("game_timer", timeLeft)

    // When game time ends
    if (timeLeft <= 0) {
      clearInterval(session.gameTimer)
      endGame(sessionId)
    }
  }, 1000)

  io.to(sessionId).emit("game_start")
}

// End game for a session
const endGame = (sessionId) => {
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

  // Clean up timers
  if (session.waitingTimer) {
    clearInterval(session.waitingTimer)
  }
  if (session.gameTimer) {
    clearInterval(session.gameTimer)
  }
}

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Handle player joining
  socket.on("join_game", ({ playerName }) => {
    // Find or create available session
    const session = findOrCreateSession()

    // Check player limit
    if (session.players.length >= MAX_PLAYERS) {
      socket.emit("error", "Oyun odası dolu. Lütfen daha sonra tekrar deneyin.")
      return
    }

    // Add player to session
    const player = {
      id: socket.id,
      name: playerName,
      score: 0,
      incorrectCount: 0,
      timeElapsed: 0,
    }

    session.players.push(player)

    // Join the socket room for this session
    socket.join(session.id)

    // Store session ID in socket for later reference
    socket.sessionId = session.id

    // Send updated player list to all clients in this session
    io.to(session.id).emit("players_updated", session.players)

    // Start waiting timer if this is the first player
    if (session.players.length === 1) {
      startWaitingTimer(session.id)
    }
  })

  // Handle game completion
  socket.on("game_completed", ({ score, incorrectCount, timeElapsed }) => {
    if (!socket.sessionId) return

    const session = gameSessions.get(socket.sessionId)
    if (!session) return

    // Update player score
    const playerIndex = session.players.findIndex((p) => p.id === socket.id)
    if (playerIndex !== -1) {
      session.players[playerIndex].score = score
      session.players[playerIndex].incorrectCount = incorrectCount
      session.players[playerIndex].timeElapsed = timeElapsed

      // Notify all clients about updated scores
      io.to(socket.sessionId).emit("players_updated", session.players)
    }
  })

  // Handle cleanup request
  socket.on("cleanup_players", () => {
    if (!socket.sessionId) return

    const session = gameSessions.get(socket.sessionId)
    if (!session) return

    // Clean up timers
    if (session.waitingTimer) {
      clearInterval(session.waitingTimer)
    }
    if (session.gameTimer) {
      clearInterval(session.gameTimer)
    }

    // Remove session
    gameSessions.delete(socket.sessionId)
  })

  // Handle reset game request
  socket.on("reset_game", () => {
    if (!socket.sessionId) return

    const session = gameSessions.get(socket.sessionId)
    if (!session) return

    // Clean up timers
    if (session.waitingTimer) {
      clearInterval(session.waitingTimer)
    }
    if (session.gameTimer) {
      clearInterval(session.gameTimer)
    }

    // Reset session
    session.status = "waiting"
    session.players = []
    session.startTime = null
    session.endTime = null

    // Notify clients
    io.to(socket.sessionId).emit("players_updated", session.players)
  })

  // Handle player disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`)

    if (!socket.sessionId) return

    const session = gameSessions.get(socket.sessionId)
    if (!session) return

    // Remove player from session
    session.players = session.players.filter((p) => p.id !== socket.id)

    // If no players left, clean up the session
    if (session.players.length === 0) {
      if (session.waitingTimer) {
        clearInterval(session.waitingTimer)
      }
      if (session.gameTimer) {
        clearInterval(session.gameTimer)
      }
      gameSessions.delete(socket.sessionId)
    } else {
      // Notify remaining players
      io.to(socket.sessionId).emit("players_updated", session.players)
    }
  })
})

// Start the server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
})

