import { NextResponse } from "next/server"

// Socket.io sunucusu ve oyun oturumları için global değişkenler
let io: any
const gameSessions = new Map()

if (typeof window === "undefined") {
  // Bu kod sadece sunucu tarafında çalışacak
  const { createServer } = require("http")
  const { Server } = require("socket.io")

  // HTTP sunucusu oluştur
  const httpServer = createServer()

  // Socket.io sunucusunu başlat
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  // Socket.io bağlantı işleyicisi
  io.on("connection", (socket: any) => {
    console.log(`User connected: ${socket.id}`)

    // Oyuncu katılma işleyicisi
    socket.on("join_game", ({ playerName }: { playerName: string }) => {
      // Basitlik için, şimdilik tek bir oyun oturumu kullanacağız
      const sessionId = "default_session"

      // Oturum yoksa oluştur
      if (!gameSessions.has(sessionId)) {
        gameSessions.set(sessionId, {
          id: sessionId,
          players: [],
          status: "waiting",
        })
      }

      const session = gameSessions.get(sessionId)

      // Oyuncuyu oturuma ekle
      const player = {
        id: socket.id,
        name: playerName,
        score: 0,
        incorrectCount: 0,
        isReady: false,
        isFinished: false,
      }

      session.players.push(player)

      // Socket odasına katıl
      socket.join(sessionId)

      // Güncellenmiş oyuncu listesini tüm istemcilere gönder
      io.to(sessionId).emit("players_updated", session.players)

      // Oturum kimliğini daha sonra referans için socket'te sakla
      socket.sessionId = sessionId
    })

    // Oyuncu hazır durumu işleyicisi
    socket.on("player_ready", (isReady: boolean) => {
      if (!socket.sessionId) return

      const session = gameSessions.get(socket.sessionId)
      if (!session) return

      // Oyuncu hazır durumunu güncelle
      const playerIndex = session.players.findIndex((p: any) => p.id === socket.id)
      if (playerIndex !== -1) {
        session.players[playerIndex].isReady = isReady

        // Tüm oyuncuların hazır olup olmadığını kontrol et
        const allReady = session.players.every((p: any) => p.isReady)

        if (allReady && session.players.length > 0) {
          // Oyunu başlat
          session.status = "playing"
          session.startTime = Date.now()
          io.to(socket.sessionId).emit("game_start")
        }

        // Tüm istemcilere güncellenmiş oyuncu durumunu bildir
        io.to(socket.sessionId).emit("players_updated", session.players)
      }
    })

    // Oyuncu oyun tamamlama işleyicisi
    socket.on(
      "game_completed",
      ({ score, incorrectCount, timeElapsed }: { score: number; incorrectCount: number; timeElapsed: number }) => {
        if (!socket.sessionId) return

        const session = gameSessions.get(socket.sessionId)
        if (!session) return

        // Oyuncu skorunu güncelle
        const playerIndex = session.players.findIndex((p: any) => p.id === socket.id)
        if (playerIndex !== -1) {
          session.players[playerIndex].score = score
          session.players[playerIndex].incorrectCount = incorrectCount
          session.players[playerIndex].timeElapsed = timeElapsed
          session.players[playerIndex].isFinished = true

          // Tüm oyuncuların bitirip bitirmediğini kontrol et
          const allFinished = session.players.every((p: any) => p.isFinished)

          if (allFinished) {
            session.status = "finished"
            session.endTime = Date.now()

            // Oyuncuları skora (en yüksek önce) ve zamana (en hızlı önce) göre sırala
            const sortedPlayers = [...session.players].sort((a: any, b: any) => {
              if (b.score !== a.score) return b.score - a.score
              return a.timeElapsed - b.timeElapsed
            })

            io.to(socket.sessionId).emit("game_finished", sortedPlayers)
          } else {
            // Sadece oyuncu listesini güncelle
            io.to(socket.sessionId).emit("players_updated", session.players)
          }
        }
      },
    )

    // Oyuncu bağlantı kesme işleyicisi
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`)

      if (!socket.sessionId) return

      const session = gameSessions.get(socket.sessionId)
      if (!session) return

      // Oyuncuyu oturumdan kaldır
      session.players = session.players.filter((p: any) => p.id !== socket.id)

      // Oyuncu kalmadıysa, oturumu kaldır
      if (session.players.length === 0) {
        gameSessions.delete(socket.sessionId)
      } else {
        // Kalan oyunculara bildir
        io.to(socket.sessionId).emit("players_updated", session.players)
      }
    })
  })

  // HTTP sunucusunu başlat
  const PORT = process.env.PORT || 3001
  httpServer.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`)
  })
}

export async function GET() {
  return NextResponse.json({ status: "Socket.io server is running" })
}

