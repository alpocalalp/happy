"use client"

import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

export default function Home() {
  const [socket, setSocket] = useState(null)
  const [playerName, setPlayerName] = useState("")
  const [players, setPlayers] = useState([])
  const [isReady, setIsReady] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    // Connect to the socket server
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      transports: ["websocket"]
    })

    socketInstance.on("connect", () => {
      console.log("Connected to socket server")
      setError("")
    })

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err)
      setError("Failed to connect to game server")
    })

    socketInstance.on("players_updated", (updatedPlayers) => {
      setPlayers(updatedPlayers)
    })

    socketInstance.on("game_start", () => {
      setGameStarted(true)
    })

    socketInstance.on("game_finished", (gameResults) => {
      setGameFinished(true)
      setResults(gameResults)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      setError("Please enter your name")
      return
    }

    socket?.emit("join_game", { playerName })
  }

  const handleReadyClick = () => {
    setIsReady(!isReady)
    socket?.emit("player_ready", !isReady)
  }

  const handleGameComplete = () => {
    socket?.emit("game_completed", {
      score: Math.floor(Math.random() * 100), // Example score
      incorrectCount: Math.floor(Math.random() * 10),
      timeElapsed: Math.floor(Math.random() * 60000)
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Thought Matching Game</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">
              {error}
            </div>
          )}

          {!players.find(p => p.id === socket?.id) ? (
            <div className="space-y-4">
              <p className="text-center text-gray-600">Enter your name to join the game</p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
                <Button onClick={handleJoinGame}>
                  Join
                </Button>
              </div>
            </div>
          ) : !gameStarted ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Players:</h3>
                <div className="space-y-1">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <span>{player.name}</span>
                      {player.isReady ? (
                        <span className="text-green-500">Ready</span>
                      ) : (
                        <span className="text-gray-400">Not Ready</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleReadyClick}
                variant={isReady ? "secondary" : "default"}
              >
                {isReady ? "Not Ready" : "Ready"}
              </Button>
            </div>
          ) : !gameFinished ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-center">Game in Progress</h3>
              <Button
                className="w-full"
                onClick={handleGameComplete}
              >
                Complete Game
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-center">Game Results</h3>
              <div className="space-y-2">
                {results.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <span>{player.name}</span>
                    <span>Score: {player.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
} 