import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export const initializeSocket = (): Socket => {
  if (!socket || !socket.connected) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    })
  }
  return socket
}

export const getSocket = (): Socket | null => {
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
} 