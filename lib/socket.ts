import { io } from "socket.io-client"

// This will be initialized in the client component
let socket: any

export const initializeSocket = () => {
  if (!socket) {
    // Öncelikle çevresel değişkenden Socket.IO sunucu URL'sini al
    // Eğer belirtilmemişse, API route'u kullan
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (typeof window !== "undefined" ? `${window.location.origin}/api/socket` : "")

    console.log("Connecting to socket server at:", socketUrl)
    
    socket = io(socketUrl, {
      // Hem websocket hem polling destekle (Render için önemli)
      transports: ["websocket", "polling"],
      // Bağlantı sorunlarında yeniden bağlanma ayarları
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
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

