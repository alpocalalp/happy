import { io } from "socket.io-client"

// This will be initialized in the client component
let socket: any

export const initializeSocket = () => {
  if (!socket) {
    // Deployment URL'sini kullan veya API route'a yönlendir
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (typeof window !== "undefined" ? `${window.location.origin}/api/socket` : "")

    socket = io(socketUrl, {
      transports: ["websocket"],
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

