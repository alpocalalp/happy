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

// Game states
const GameState = {
  WAITING: "waiting",
  PLAYING: "playing",
  FINISHED: "finished",
}

// Store active game sessions
const gameSessions = new Map()

// Generate a random session ID
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 9)
}

// Create a new game session
const createGameSession = () => {
  const sessionId = generateSessionId()
  const session = {
    id: sessionId,
    players: [],
    status: GameState.WAITING,
    waitingTimer: null,
    gameTimer: null,
    timeLeft: WAITING_TIME,
    startTime: null,
    endTime: null,
  }
  gameSessions.set(sessionId, session)
  return session
}

// Find or create available session
const findOrCreateSession = () => {
  // Look for an available waiting session
  for (const [id, session] of gameSessions) {
    if (session.status === GameState.WAITING && session.players.length < MAX_PLAYERS) {
      return session
    }
  }

  // Create new session if no available session found
  return createGameSession()
}

// Clear session timers
const clearSessionTimers = (session) => {
  if (session.waitingTimer) {
    clearInterval(session.waitingTimer)
    session.waitingTimer = null
  }
  if (session.gameTimer) {
    clearInterval(session.gameTimer)
    session.gameTimer = null
  }
}

// Start waiting timer for a session
const startWaitingTimer = (sessionId) => {
  const session = gameSessions.get(sessionId)
  if (!session) return

  console.log(`Starting waiting timer for session ${sessionId}`)

  // Clear any existing timers
  clearSessionTimers(session)

  // Reset and initialize the timer
  session.timeLeft = WAITING_TIME
  session.status = GameState.WAITING
  
  // Immediately send initial time
  io.to(sessionId).emit("waiting_timer", session.timeLeft)
  console.log(`Initial waiting time sent: ${session.timeLeft}ms`)

  // Start new timer
  session.waitingTimer = setInterval(() => {
    session.timeLeft -= 1000

    // Notify clients about remaining time
    io.to(sessionId).emit("waiting_timer", session.timeLeft)
    console.log(`Waiting timer update for session ${sessionId}: ${session.timeLeft}ms remaining`)

    // When timer ends
    if (session.timeLeft <= 0) {
      console.log(`Waiting timer ended for session ${sessionId}, starting game`)
      clearInterval(session.waitingTimer)
      session.waitingTimer = null
      startGame(sessionId)
    }
  }, 1000)
}

// Start game for a session
const startGame = (sessionId) => {
  const session = gameSessions.get(sessionId)
  if (!session) return

  console.log(`Starting game for session ${sessionId}`)

  // Clear any existing timers
  clearSessionTimers(session)

  // Update session state
  session.status = GameState.PLAYING
  session.startTime = Date.now()
  session.timeLeft = MAX_GAME_TIME
  
  // Immediately send initial time and game start signal
  io.to(sessionId).emit("game_timer", session.timeLeft)
  io.to(sessionId).emit("game_start")
  console.log(`Initial game time sent: ${session.timeLeft}ms`)

  // Start game timer
  session.gameTimer = setInterval(() => {
    session.timeLeft -= 1000

    // Notify clients about remaining time
    io.to(sessionId).emit("game_timer", session.timeLeft)
    console.log(`Game timer update for session ${sessionId}: ${session.timeLeft}ms remaining`)

    // When game time ends
    if (session.timeLeft <= 0) {
      console.log(`Game timer ended for session ${sessionId}`)
      clearInterval(session.gameTimer)
      session.gameTimer = null
      endGame(sessionId)
    }
  }, 1000)
}

// End game for a session
const endGame = (sessionId) => {
  const session = gameSessions.get(sessionId)
  if (!session) return

  console.log(`Ending game for session ${sessionId}`)

  // Update session state
  session.status = GameState.FINISHED
  session.endTime = Date.now()

  // Clear any existing timers
  clearSessionTimers(session)

  // Sort players by score and time
  const sortedPlayers = [...session.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.timeElapsed - b.timeElapsed
  })

  // Send final results
  io.to(sessionId).emit("game_finished", sortedPlayers)
  console.log(`Game finished for session ${sessionId}`)
}

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Handle player joining
  socket.on("join_game", ({ playerName }) => {
    try {
      // Find or create available session
      const session = findOrCreateSession()

      // Check player limit
      if (session.players.length >= MAX_PLAYERS) {
        socket.emit("error", "Oyun odası dolu. Lütfen daha sonra tekrar deneyin.")
        return
      }

      // Check if game is already in progress
      if (session.status !== GameState.WAITING) {
        const newSession = createGameSession()
        socket.emit("info", "Yeni bir oyun odasına yönlendiriliyorsunuz.")
        session = newSession
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
      socket.sessionId = session.id

      // Send updated player list to all clients in this session
      io.to(session.id).emit("players_updated", session.players)

      // Start or restart waiting timer
      if (session.status === GameState.WAITING) {
        console.log(`Starting/Restarting waiting timer for session ${session.id}`)
        startWaitingTimer(session.id)
      }

      console.log(`Player ${playerName} (${socket.id}) joined session ${session.id}`)
    } catch (error) {
      console.error("Error in join_game:", error)
      socket.emit("error", "Oyuna katılırken bir hata oluştu. Lütfen tekrar deneyin.")
    }
  })

  // Handle game completion
  socket.on("game_completed", ({ score, incorrectCount, timeElapsed }) => {
    try {
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
        console.log(`Updated score for player ${socket.id} in session ${socket.sessionId}`)
      }
    } catch (error) {
      console.error("Error in game_completed:", error)
    }
  })

  // Handle cleanup request
  socket.on("cleanup_players", () => {
    try {
      if (!socket.sessionId) return

      const session = gameSessions.get(socket.sessionId)
      if (!session) return

      // Clear timers and remove session
      clearSessionTimers(session)
      gameSessions.delete(socket.sessionId)
      console.log(`Cleaned up session ${socket.sessionId}`)
    } catch (error) {
      console.error("Error in cleanup_players:", error)
    }
  })

  // Handle reset game request
  socket.on("reset_game", () => {
    try {
      if (!socket.sessionId) return

      const session = gameSessions.get(socket.sessionId)
      if (!session) return

      // Clear timers
      clearSessionTimers(session)

      // Create new session
      const newSession = createGameSession()
      gameSessions.delete(socket.sessionId)
      console.log(`Reset game for session ${socket.sessionId}`)

      // Notify clients
      io.to(socket.sessionId).emit("players_updated", [])
    } catch (error) {
      console.error("Error in reset_game:", error)
    }
  })

  // Handle player disconnect
  socket.on("disconnect", () => {
    try {
      console.log(`User disconnected: ${socket.id}`)

      if (!socket.sessionId) return

      const session = gameSessions.get(socket.sessionId)
      if (!session) return

      // Remove player from session
      session.players = session.players.filter((p) => p.id !== socket.id)

      // If no players left, clean up the session
      if (session.players.length === 0) {
        clearSessionTimers(session)
        gameSessions.delete(socket.sessionId)
        console.log(`Removed empty session ${socket.sessionId}`)
      } else {
        // Notify remaining players
        io.to(socket.sessionId).emit("players_updated", session.players)
      }
    } catch (error) {
      console.error("Error in disconnect:", error)
    }
  })
})

// Start the server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
})

