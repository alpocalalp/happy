import { io } from "socket.io-client"

// This will be initialized in the client component
let socket: any

export const initializeSocket = () => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"

    console.log("Connecting to socket server at:", socketUrl)
    
    socket = io(socketUrl, {
      // Hem websocket hem polling destekle (Render için önemli)
      transports: ["websocket"],
      // Bağlantı sorunlarında yeniden bağlanma ayarları
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true
    })
    
    // Hata ayıklama için bağlantı olay dinleyicileri ekle
    socket.on("connect", () => {
      console.log("Socket connected successfully with ID:", socket.id)
    })
    
    socket.on("connect_error", (err: any) => {
      console.error("Socket connection error:", err.message)
    })
    
    socket.on("disconnect", (reason: string) => {
      console.log("Socket disconnected:", reason)
      // Yeniden bağlanma denemesi
      setTimeout(() => {
        if (!socket.connected) {
          console.log("Attempting to reconnect...")
          socket.connect()
        }
      }, 5000)
    })
  }
  return socket
}

export const getSocket = () => {
  if (!socket) {
    return initializeSocket()
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

