"use client"

import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

const GAME_DURATION = 60 // 60 seconds game duration
const THOUGHTS = [
  "Mutluluk", "Heyecan", "Hüzün", "Özlem", "Sevgi",
  "Umut", "Korku", "Merak", "Şaşkınlık", "Huzur"
]

export default function Home() {
  const [socket, setSocket] = useState(null)
  const [playerName, setPlayerName] = useState("")
  const [players, setPlayers] = useState([])
  const [isReady, setIsReady] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState("")
  
  // Game state
  const [currentThought, setCurrentThought] = useState("")
  const [selectedThoughts, setSelectedThoughts] = useState([])
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [score, setScore] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)

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
      startGame()
    })

    socketInstance.on("game_finished", (gameResults) => {
      setGameFinished(true)
      setResults(gameResults)
    })

    socketInstance.on("thought_match", ({ thought, matches }) => {
      if (matches) {
        setScore(prev => prev + 10)
        // Show success feedback
      } else {
        setIncorrectCount(prev => prev + 1)
        // Show error feedback
      }
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Game timer
  useEffect(() => {
    let timer
    if (gameStarted && !gameFinished && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleGameComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [gameStarted, gameFinished, timeLeft])

  const startGame = () => {
    setTimeLeft(GAME_DURATION)
    setScore(0)
    setIncorrectCount(0)
    setSelectedThoughts([])
    setCurrentThought(THOUGHTS[Math.floor(Math.random() * THOUGHTS.length)])
  }

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

  const handleThoughtSelect = (thought) => {
    if (selectedThoughts.includes(thought)) return

    setSelectedThoughts(prev => [...prev, thought])
    socket?.emit("submit_thought", { thought })
    
    // Get next thought
    const remainingThoughts = THOUGHTS.filter(t => !selectedThoughts.includes(t))
    if (remainingThoughts.length > 0) {
      setCurrentThought(remainingThoughts[Math.floor(Math.random() * remainingThoughts.length)])
    }
  }

  const handleGameComplete = () => {
    socket?.emit("game_completed", {
      score,
      incorrectCount,
      timeElapsed: GAME_DURATION - timeLeft
    })
    setGameFinished(true)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-medium">Score: {score}</div>
                <div className="text-sm font-medium">Time: {formatTime(timeLeft)}</div>
              </div>
              
              <div className="p-4 bg-white rounded-lg border text-center mb-4">
                <h3 className="text-lg font-semibold mb-2">Current Thought</h3>
                <p className="text-2xl font-bold text-blue-600">{currentThought}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {THOUGHTS.map((thought) => (
                  <Button
                    key={thought}
                    onClick={() => handleThoughtSelect(thought)}
                    disabled={selectedThoughts.includes(thought)}
                    variant={selectedThoughts.includes(thought) ? "secondary" : "default"}
                    className="w-full"
                  >
                    {thought}
                  </Button>
                ))}
              </div>
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