import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export const initializeSocket = (): Socket => {
  if (!socket || !socket.connected) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      forceNew: false
    })

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
    })

    socket.on("connect", () => {
      console.log("Socket connected successfully")
    })

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason)
    })
  }
  return socket
}

export const getSocket = (): Socket | null => {
  if (!socket || !socket.connected) {
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