"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { Check, AlertCircle, Trophy, Users, Clock } from "lucide-react"
import { initializeSocket, getSocket } from "@/lib/socket"
import { Player } from "@/lib/types"

interface Question {
  statement: string
  correctAnswer: string
  options: string[]
}

const questions: Question[] = [
  {
    statement: "Bu benim için gerçekten önemli, ama bunu yapabilmek için bir plan yapmalıyım.",
    correctAnswer: "Sağlıklı Yetişkin Modu",
    options: [
      "Uyumlu Teslimci Çocuk Modu",
      "Talepkâr Mod",
      "Kızgın Korungan Çocuk Modu",
      "Kaygılı Çocuk Modu",
      "Sağlıklı Yetişkin Modu",
    ],
  },
  {
    statement: "Herkes hata yapabilir, önemli olan nasıl telafi edeceğim.",
    correctAnswer: "Sağlıklı Yetişkin Modu",
    options: [
      "Uyumlu Teslimci Çocuk Modu",
      "Talepkâr Mod",
      "Kızgın Korungan Çocuk Modu",
      "Kaygılı Çocuk Modu",
      "Sağlıklı Yetişkin Modu",
    ],
  },
  {
    statement: "Ya ebeveynliğim başarısız olduysa? Ya çocuklarım beni sevmiyorsa?",
    correctAnswer: "Kaygılı Çocuk Modu",
    options: [
      "Uyumlu Teslimci Çocuk Modu",
      "Talepkâr Mod",
      "Kızgın Korungan Çocuk Modu",
      "Kaygılı Çocuk Modu",
      "Sağlıklı Yetişkin Modu",
    ],
  },
  {
    statement: "Her şey kötüye gidecek, kontrolü kaybedeceğim!",
    correctAnswer: "Kaygılı Çocuk Modu",
    options: [
      "Uyumlu Teslimci Çocuk Modu",
      "Talepkâr Mod",
      "Kızgın Korungan Çocuk Modu",
      "Kaygılı Çocuk Modu",
      "Sağlıklı Yetişkin Modu",
    ],
  },
  {
    statement: "Ne çocuklarım ne torunlarım beni aramıyor! Nankörlük yapıyorlar!",
    correctAnswer: "Kızgın Korungan Çocuk Modu",
    options: [
      "Uyumlu Teslimci Çocuk Modu",
      "Talepkâr Mod",
      "Kızgın Korungan Çocuk Modu",
      "Kaygılı Çocuk Modu",
      "Sağlıklı Yetişkin Modu",
    ],
  },
  {
    statement: "Beni kimse incitemez, herkese sert olmalıyım!",
    correctAnswer: "Kızgın Korungan Çocuk Modu",
    options: [
      "Uyumlu Teslimci Çocuk Modu",
      "Talepkâr Mod",
      "Kızgın Korungan Çocuk Modu",
      "Kaygılı Çocuk Modu",
      "Sağlıklı Yetişkin Modu",
    ],
  },
  {
    statement: "Bakıma muhtaç hale gelmemeliyim, her şey mükemmel olmalı!",
    correctAnswer: "Talepkâr Mod",
    options: [
      "Uyumlu Teslimci Çocuk Modu",
      "Talepkâr Mod",
      "Kızgın Korungan Çocuk Modu",
      "Kaygılı Çocuk Modu",
      "Sağlıklı Yetişkin Modu",
    ],
  },
  {
    statement: "Hedefime ulaşana kadar durmamalıyım, dinlenmek zayıflıktır!",
    correctAnswer: "Talepkâr Mod",
    options: [
      "Uyumlu Teslimci Çocuk Modu",
      "Talepkâr Mod",
      "Kızgın Korungan Çocuk Modu",
      "Kaygılı Çocuk Modu",
      "Sağlıklı Yetişkin Modu",
    ],
  },
  {
    statement: "Yorgun olsam dahi, çocuklarıma zaman ayırmalıyım.",
    correctAnswer: "Uyumlu Teslimci Çocuk Modu",
    options: [
      "Uyumlu Teslimci Çocuk Modu",
      "Talepkâr Mod",
      "Kızgın Korungan Çocuk Modu",
      "Kaygılı Çocuk Modu",
      "Sağlıklı Yetişkin Modu",
    ],
  },
  {
    statement: "Önemli değil, benim hislerim ya da ihtiyaçlarım hiç önemli değil, yeter ki sorun çıkmasın, ailem mutlu olsun",
    correctAnswer: "Uyumlu Teslimci Çocuk Modu",
    options: [
      "Uyumlu Teslimci Çocuk Modu",
      "Talepkâr Mod",
      "Kızgın Korungan Çocuk Modu",
      "Kaygılı Çocuk Modu",
      "Sağlıklı Yetişkin Modu",
    ],
  },
]

export default function ThoughtMatchingGame() {
  const [gameState, setGameState] = useState<"name" | "waiting" | "playing" | "success" | "leaderboard">("name")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState<number>(0)
  const [incorrectCount, setIncorrectCount] = useState<number>(0)
  const [playerName, setPlayerName] = useState<string>("")
  const [players, setPlayers] = useState<Player[]>([])
  const [isReady, setIsReady] = useState<boolean>(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [endTime, setEndTime] = useState<number | null>(null)
  const [leaderboard, setLeaderboard] = useState<Player[]>([])
  const [error, setError] = useState<string>("")

  // Initialize socket connection
  useEffect(() => {
    const socket = initializeSocket()

    socket.on("connect", () => {
      console.log("Connected to socket server")
      setError("")
    })

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err)
      setError("Failed to connect to game server")
    })

    socket.on("players_updated", (updatedPlayers) => {
      setPlayers(updatedPlayers)
    })

    socket.on("game_start", () => {
      setGameState("playing")
      setStartTime(Date.now())
    })

    socket.on("game_finished", (finalLeaderboard) => {
      setLeaderboard(finalLeaderboard)
      setGameState("leaderboard")
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      setError("Please enter your name")
      return
    }

    const socket = getSocket()
    socket.emit("join_game", { playerName: playerName.trim() })
    setGameState("waiting")
  }

  const handleToggleReady = () => {
    const newReadyState = !isReady
    setIsReady(newReadyState)

    const socket = getSocket()
    socket.emit("player_ready", newReadyState)
  }

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer)
    const correct = answer === questions[currentQuestionIndex].correctAnswer
    setIsCorrect(correct)

    if (correct) {
      setScore(score + 1)
    } else {
      setIncorrectCount(incorrectCount + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
    } else {
      setEndTime(Date.now())
      setGameState("success")

      // Emit game completion to server
      const socket = getSocket()
      const timeElapsed = startTime ? Date.now() - startTime : 0
      socket.emit("game_completed", {
        score,
        incorrectCount,
        timeElapsed,
      })
    }
  }

  const handleRestart = () => {
    setGameState("waiting")
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setScore(0)
    setIncorrectCount(0)
    setIsReady(false)
    setStartTime(null)
    setEndTime(null)
  }

  const getColorForMode = (mode: string) => {
    switch (mode) {
      case "Sağlıklı Yetişkin Modu":
        return "bg-green-100 border-green-300 hover:bg-green-200"
      case "Kaygılı Çocuk Modu":
        return "bg-blue-100 border-blue-300 hover:bg-blue-200"
      case "Kızgın Korungan Çocuk Modu":
        return "bg-red-100 border-red-300 hover:bg-red-200"
      case "Talepkâr Mod":
        return "bg-purple-100 border-purple-300 hover:bg-purple-200"
      case "Uyumlu Teslimci Çocuk Modu":
        return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200"
      default:
        return "bg-gray-100 border-gray-300 hover:bg-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 flex flex-col items-center justify-center">
      {gameState === "name" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-6">
            <h1 className="text-2xl font-bold text-center mb-6">Düşünce Eşleştirme Oyunu</h1>
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Adınızı girin"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              <Button className="w-full" onClick={handleJoinGame}>
                Oyuna Katıl
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {gameState === "waiting" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Oyuncular</h2>
            <div className="space-y-2 mb-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <span>{player.name}</span>
                  {player.isReady ? (
                    <span className="text-green-500 flex items-center">
                      <Check className="w-4 h-4 mr-1" />
                      Hazır
                    </span>
                  ) : (
                    <span className="text-gray-400">Bekleniyor</span>
                  )}
                </div>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={handleToggleReady}
              variant={isReady ? "secondary" : "default"}
            >
              {isReady ? "Hazır Değil" : "Hazır"}
            </Button>
          </Card>
        </motion.div>
      )}

      {gameState === "playing" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">Skor: {score}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Oyuncular: {players.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <span className="font-medium">
                  Süre: {startTime ? Math.floor((Date.now() - startTime) / 1000) : 0}s
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Soru {currentQuestionIndex + 1}/{questions.length}</h3>
              <p className="text-gray-700 text-lg">{questions[currentQuestionIndex].statement}</p>
            </div>

            <div className="grid grid-cols-1 gap-2 mb-6">
              {questions[currentQuestionIndex].options.map((option) => (
                <Button
                  key={option}
                  onClick={() => handleSelectAnswer(option)}
                  disabled={selectedAnswer !== null}
                  className={`w-full justify-start px-4 py-3 text-left ${
                    selectedAnswer === option
                      ? option === questions[currentQuestionIndex].correctAnswer
                        ? "bg-green-100 border-green-300 hover:bg-green-200"
                        : "bg-red-100 border-red-300 hover:bg-red-200"
                      : getColorForMode(option)
                  }`}
                >
                  {option}
                </Button>
              ))}
            </div>

            {selectedAnswer && (
              <div
                className={`p-4 rounded-lg mb-4 flex items-center ${
                  isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {isCorrect ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    <span>Doğru cevap!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span>
                      Yanlış cevap. Doğru cevap: {questions[currentQuestionIndex].correctAnswer}
                    </span>
                  </>
                )}
              </div>
            )}

            {selectedAnswer && (
              <Button className="w-full" onClick={handleNextQuestion}>
                {currentQuestionIndex < questions.length - 1 ? "Sonraki Soru" : "Oyunu Bitir"}
              </Button>
            )}
          </Card>
        </motion.div>
      )}

      {gameState === "success" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Tebrikler!</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span>Toplam Skor:</span>
                <span className="font-bold">{score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Yanlış Sayısı:</span>
                <span className="font-bold">{incorrectCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Geçen Süre:</span>
                <span className="font-bold">
                  {startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0}s
                </span>
              </div>
            </div>
            <Button className="w-full" onClick={handleRestart}>
              Yeniden Oyna
            </Button>
          </Card>
        </motion.div>
      )}

      {gameState === "leaderboard" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Skor Tablosu</h2>
            <div className="space-y-2 mb-6">
              {leaderboard.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-white rounded border"
                >
                  <div className="flex items-center">
                    <span className="font-medium mr-2">#{index + 1}</span>
                    <span>{player.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span>Skor: {player.score}</span>
                    <span>Süre: {Math.floor(player.timeElapsed / 1000)}s</span>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={handleRestart}>
              Yeniden Oyna
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  )
} 