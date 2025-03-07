import { io } from "socket.io-client"

// This will be initialized in the client component
let socket: any

export const initializeSocket = () => {
  if (!socket) {
    // Render'daki socket sunucusunun URL'i
    const socketUrl = "https://thought-matching-game-socket.onrender.com"

    console.log("Connecting to socket server at:", socketUrl)
    
    socket = io(socketUrl, {
      // Hem websocket hem polling destekle
      transports: ["websocket", "polling"],
      // Bağlantı sorunlarında yeniden bağlanma ayarları
      reconnectionAttempts: Infinity, // Sürekli yeniden bağlanmayı dene
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true
    })
    
    // Hata ayıklama için bağlantı olay dinleyicileri
    socket.on("connect", () => {
      console.log("Socket connected successfully with ID:", socket.id)
    })
    
    socket.on("connect_error", (err: any) => {
      console.error("Socket connection error:", err.message)
      // Hata durumunda yeniden bağlanmayı dene
      setTimeout(() => {
        if (!socket.connected) {
          socket.connect()
        }
      }, 1000)
    })
    
    socket.on("disconnect", (reason: string) => {
      console.log("Socket disconnected:", reason)
      // Yeniden bağlanma denemesi
      setTimeout(() => {
        if (!socket.connected) {
          console.log("Attempting to reconnect...")
          socket.connect()
        }
      }, 1000)
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

