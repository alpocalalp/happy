"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { Check, AlertCircle, Trophy, Users, Clock } from "lucide-react"
import { initializeSocket, getSocket } from "@/lib/socket"
import type { Player } from "@/lib/types"

export default function ThoughtMatchingGame() {
  const [gameState, setGameState] = useState<"name" | "waiting" | "playing" | "success" | "leaderboard">("name")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [playerName, setPlayerName] = useState("")
  const [players, setPlayers] = useState<Player[]>([])
  const [isReady, setIsReady] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [endTime, setEndTime] = useState<number | null>(null)
  const [leaderboard, setLeaderboard] = useState<Player[]>([])

  // Initialize socket connection
  useEffect(() => {
    const socket = initializeSocket()

    // Listen for player updates
    socket.on("players_updated", (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers)
    })

    // Listen for game start
    socket.on("game_start", () => {
      setGameState("playing")
      setStartTime(Date.now())
    })

    // Listen for game finished
    socket.on("game_finished", (finalLeaderboard: Player[]) => {
      setLeaderboard(finalLeaderboard)
      setGameState("leaderboard")
    })

    return () => {
      socket.off("players_updated")
      socket.off("game_start")
      socket.off("game_finished")
    }
  }, [])

  const handleJoinGame = () => {
    if (playerName.trim()) {
      const socket = getSocket()
      socket.emit("join_game", { playerName: playerName.trim() })
      setGameState("waiting")
    }
  }

  const handleToggleReady = () => {
    const newReadyState = !isReady
    setIsReady(newReadyState)

    const socket = getSocket()
    socket.emit("player_ready", newReadyState)
  }

  const questions = [
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
      statement:
        "Önemli değil, benim hislerim ya da ihtiyaçlarım hiç önemli değil, yeter ki sorun çıkmasın, ailem mutlu olsun",
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
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="overflow-hidden bg-white/90 backdrop-blur-sm shadow-lg rounded-3xl border-0">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
              <h1 className="text-2xl font-bold text-center text-white">Otomatik Düşünceleri Eşleştirme</h1>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6 text-center">Çok oyunculu oyuna katılmak için lütfen adınızı girin.</p>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Adınız"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="rounded-xl p-6 text-lg"
                />
                <Button
                  onClick={handleJoinGame}
                  disabled={!playerName.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full py-6"
                >
                  Oyuna Katıl
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {gameState === "waiting" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="overflow-hidden bg-white/90 backdrop-blur-sm shadow-lg rounded-3xl border-0">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
              <h1 className="text-2xl font-bold text-center text-white">Bekleme Odası</h1>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Oyuncular: {players.length}</span>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${isReady ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                  >
                    {isReady ? "Hazır" : "Hazır Değil"}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 max-h-60 overflow-y-auto">
                <h2 className="font-medium text-gray-700 mb-2">Oyuncu Listesi:</h2>
                <ul className="space-y-2">
                  {players.map((player) => (
                    <li
                      key={player.id}
                      className="flex items-center justify-between p-2 rounded-lg border border-gray-200"
                    >
                      <span>{player.name}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${player.isReady ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                      >
                        {player.isReady ? "Hazır" : "Bekliyor"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-gray-700 mb-4 text-center">
                Tüm oyuncular hazır olduğunda oyun otomatik olarak başlayacaktır.
              </p>

              <Button
                onClick={handleToggleReady}
                className={`w-full py-6 rounded-full ${
                  isReady
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                }`}
              >
                {isReady ? "Hazır Değilim" : "Hazırım"}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {gameState === "playing" && (
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="overflow-hidden bg-white/90 backdrop-blur-sm shadow-lg rounded-3xl border-0">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    {score}
                  </div>
                  <div className="bg-red-100 text-red-800 rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {incorrectCount}
                  </div>
                </div>
                <span className="text-white font-medium">
                  {currentQuestionIndex + 1}/{questions.length}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="w-full bg-gray-200 h-2 rounded-full mb-4">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  style={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
                ></div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-2">Düşünce:</h2>
                <p className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-gray-700">
                  "{questions[currentQuestionIndex].statement}"
                </p>
              </div>

              <h3 className="text-md font-bold text-gray-800 mb-2">Bu düşünce hangi moda ait?</h3>

              <div className="space-y-2 mb-4">
                {questions[currentQuestionIndex].options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={selectedAnswer !== null}
                    className={`w-full p-4 border rounded-xl text-left transition-all relative ${
                      selectedAnswer !== null
                        ? option === questions[currentQuestionIndex].correctAnswer
                          ? "bg-green-100 border-green-500"
                          : selectedAnswer === option
                            ? "bg-red-100 border-red-500"
                            : "bg-gray-100 border-gray-300 text-gray-500"
                        : getColorForMode(option)
                    } ${selectedAnswer ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <span className="pr-8">{option}</span>

                    {selectedAnswer !== null &&
                      (option === questions[currentQuestionIndex].correctAnswer ? (
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <Check className="h-6 w-6 text-green-600" />
                        </span>
                      ) : selectedAnswer === option ? (
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        </span>
                      ) : null)}
                  </button>
                ))}
              </div>

              {selectedAnswer && (
                <div className="mt-4">
                  <Button
                    onClick={handleNextQuestion}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full py-6"
                  >
                    {currentQuestionIndex < questions.length - 1 ? "Sonraki Soru" : "Sonuçları Gör"}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {gameState === "success" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="overflow-hidden bg-white/90 backdrop-blur-sm shadow-lg rounded-3xl border-0">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
              <h1 className="text-2xl font-bold text-center text-white">Tebrikler!</h1>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6 text-center">
                Artık içinde bulunduğunuz modun size neler söylediğini gözlemleyebilir ve bu sayede hatalı
                düşüncelerinizi yakalayabilmek için ilk adımı atmış oldunuz.
              </p>
              <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <h2 className="text-lg font-medium text-center text-purple-800 mb-2">Skorunuz</h2>
                <div className="flex justify-center items-center gap-4">
                  <div className="bg-green-100 text-green-800 rounded-full px-4 py-2 text-lg font-medium flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Doğru: {score}
                  </div>
                  <div className="bg-red-100 text-red-800 rounded-full px-4 py-2 text-lg font-medium flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Yanlış: {incorrectCount}
                  </div>
                </div>
                <div className="text-3xl font-bold text-center text-purple-900 mt-4">
                  {score}/{questions.length}
                </div>
              </div>
              <p className="text-gray-700 mb-6 text-center">Diğer oyuncuların tamamlamasını bekliyoruz...</p>
            </div>
          </Card>
        </motion.div>
      )}

      {gameState === "leaderboard" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="overflow-hidden bg-white/90 backdrop-blur-sm shadow-lg rounded-3xl border-0">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
              <h1 className="text-2xl font-bold text-center text-white">Skor Tablosu</h1>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-center mb-4">
                  <Trophy className="h-12 w-12 text-yellow-500" />
                </div>
                <h2 className="text-xl font-bold text-center text-purple-800 mb-4">Sonuçlar</h2>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 max-h-60 overflow-y-auto">
                  <ul className="space-y-3">
                    {leaderboard.map((player, index) => (
                      <li
                        key={player.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          index === 0
                            ? "bg-yellow-50 border-yellow-300"
                            : index === 1
                              ? "bg-gray-100 border-gray-300"
                              : index === 2
                                ? "bg-amber-50 border-amber-300"
                                : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-700 w-6">{index + 1}.</span>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-green-700">
                            <Check className="h-4 w-4" />
                            <span>{player.score}</span>
                          </div>
                          <div className="flex items-center gap-1 text-red-700">
                            <AlertCircle className="h-4 w-4" />
                            <span>{player.incorrectCount}</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-700">
                            <Clock className="h-4 w-4" />
                            <span>{Math.floor((player.timeElapsed || 0) / 1000)}s</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Button
                onClick={handleRestart}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full py-6"
              >
                Yeni Oyun
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

