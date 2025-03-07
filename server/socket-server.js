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

// Store active game sessions
const gameSessions = new Map()

// Generate a random session ID
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 9)
}

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Handle player joining
  socket.on("join_game", ({ playerName }) => {
    // For simplicity, we'll use a single game session for now
    const sessionId = "default_session"

    // Create session if it doesn't exist
    if (!gameSessions.has(sessionId)) {
      gameSessions.set(sessionId, {
        id: sessionId,
        players: [],
        status: "waiting",
      })
    }

    const session = gameSessions.get(sessionId)

    // Add player to session
    const player = {
      id: socket.id,
      name: playerName,
      score: 0,
      incorrectCount: 0,
      isReady: false,
      isFinished: false,
    }

    session.players.push(player)

    // Join the socket room for this session
    socket.join(sessionId)

    // Send updated player list to all clients in this session
    io.to(sessionId).emit("players_updated", session.players)

    // Store session ID in socket for later reference
    socket.sessionId = sessionId
  })

  // Handle player ready status
  socket.on("player_ready", (isReady) => {
    if (!socket.sessionId) return

    const session = gameSessions.get(socket.sessionId)
    if (!session) return

    // Update player ready status
    const playerIndex = session.players.findIndex((p) => p.id === socket.id)
    if (playerIndex !== -1) {
      session.players[playerIndex].isReady = isReady

      // Check if all players are ready
      const allReady = session.players.every((p) => p.isReady)

      if (allReady && session.players.length > 0) {
        // Start the game
        session.status = "playing"
        session.startTime = Date.now()
        io.to(socket.sessionId).emit("game_start")
      }

      // Notify all clients about updated player status
      io.to(socket.sessionId).emit("players_updated", session.players)
    }
  })

  // Handle player game completion
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
      session.players[playerIndex].isFinished = true

      // Check if all players have finished
      const allFinished = session.players.every((p) => p.isFinished)

      if (allFinished) {
        session.status = "finished"
        session.endTime = Date.now()

        // Sort players by score (highest first) and time (fastest first)
        const sortedPlayers = [...session.players].sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          return a.timeElapsed - b.timeElapsed
        })

        io.to(socket.sessionId).emit("game_finished", sortedPlayers)
      } else {
        // Just update the player list
        io.to(socket.sessionId).emit("players_updated", session.players)
      }
    }
  })

  // Handle player disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`)

    if (!socket.sessionId) return

    const session = gameSessions.get(socket.sessionId)
    if (!session) return

    // Remove player from session
    session.players = session.players.filter((p) => p.id !== socket.id)

    // If no players left, remove the session
    if (session.players.length === 0) {
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

