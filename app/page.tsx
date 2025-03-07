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

// Yeni tip tanımlamaları
type GameState = "rules" | "name" | "waiting" | "playing" | "success" | "leaderboard"

interface GameRules {
  title: string
  description: string[]
}

const GAME_RULES: GameRules = {
  title: "Düşünce Eşleştirme Oyunu Kuralları",
  description: [
    "• Oyun maksimum 5 dakika sürecektir.",
    "• İsminizi girdikten sonra 20 saniye içinde diğer oyuncular katılabilir.",
    "• 20 saniye içinde başka oyuncu katılmazsa, tek başınıza oynarsınız.",
    "• En çok doğru cevabı veren oyuncu kazanır.",
    "• Oyun başladıktan sonra yeni oyuncu katılamaz.",
    "• Her soru için süreniz sınırlıdır.",
  ],
}

const MAX_GAME_TIME = 5 * 60 * 1000 // 5 dakika (milisaniye cinsinden)
const WAITING_TIME = 20 * 1000 // 20 saniye (milisaniye cinsinden)

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
  const [gameState, setGameState] = useState<GameState>("rules")
  const [waitingTimer, setWaitingTimer] = useState<number>(WAITING_TIME)
  const [gameTimer, setGameTimer] = useState<number>(MAX_GAME_TIME)
  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false)
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

  // Oyun kuralları ekranından isim girme ekranına geçiş
  const handleStartGame = () => {
    setGameState("name")
  }

  // Socket bağlantısı ve event dinleyicileri
  useEffect(() => {
    const socket = initializeSocket()

    socket.on("connect", () => {
      console.log("Connected to socket server")
      setError("")
    })

    socket.on("connect_error", (err: Error) => {
      console.error("Socket connection error:", err)
      setError("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.")
    })

    socket.on("disconnect", () => {
      console.log("Disconnected from socket server")
      setError("Sunucu bağlantısı kesildi. Yeniden bağlanılıyor...")
    })

    socket.on("players_updated", (updatedPlayers: Player[]) => {
      console.log("Players updated:", updatedPlayers)
      const uniquePlayers = updatedPlayers.filter((player, index, self) =>
        index === self.findIndex((p) => p.id === player.id)
      )
      setPlayers(uniquePlayers)
      setIsMultiplayer(uniquePlayers.length > 1)
    })

    socket.on("game_start", () => {
      console.log("Game starting...")
      setGameState("playing")
      setStartTime(Date.now())
      setWaitingTimer(0) // Reset waiting timer when game starts
    })

    socket.on("waiting_timer", (timeLeft: number) => {
      console.log("Waiting timer update:", timeLeft)
      setWaitingTimer(timeLeft)
    })

    socket.on("game_timer", (timeLeft: number) => {
      console.log("Game timer update:", timeLeft)
      setGameTimer(timeLeft)
      if (timeLeft <= 0) {
        handleGameEnd()
      }
    })

    socket.on("error", (message: string) => {
      console.error("Server error:", message)
      setError(message)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // Oyun bitişi işleyicisi
  const handleGameEnd = () => {
    const endTime = Date.now()
    setEndTime(endTime)
    setGameState("success")

    try {
      const socket = getSocket()
      if (!socket || !socket.connected) {
        setError("Sunucu bağlantısı koptu. Skorunuz kaydedilemeyebilir.")
        return
      }

      const timeElapsed = startTime ? endTime - startTime : 0
      socket.emit("game_completed", {
        score,
        incorrectCount,
        timeElapsed,
      })
    } catch (err) {
      console.error("Error completing game:", err)
      setError("Oyun sonucu gönderilirken bir hata oluştu.")
    }
  }

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      setError("Lütfen adınızı girin")
      return
    }

    try {
      const socket = getSocket()
      
      // Socket bağlantısını kontrol et, bağlı değilse yeniden bağlan
      if (!socket || !socket.connected) {
        console.log("Socket not connected, initializing new connection...")
        const newSocket = initializeSocket()
        
        newSocket.on("connect", () => {
          console.log("New socket connection established")
          newSocket.emit("join_game", { playerName: playerName.trim() })
          setGameState("waiting")
          setError("")
          setWaitingTimer(WAITING_TIME) // Set initial waiting time
        })

        newSocket.on("connect_error", (err: Error) => {
          console.error("New socket connection error:", err)
          setError("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.")
        })
      } else {
        // Socket zaten bağlıysa direkt oyuna katıl
        console.log("Using existing socket connection")
        socket.emit("join_game", { playerName: playerName.trim() })
        setGameState("waiting")
        setError("")
        setWaitingTimer(WAITING_TIME) // Set initial waiting time
      }
    } catch (err) {
      console.error("Error joining game:", err)
      setError("Oyuna katılırken bir hata oluştu. Lütfen tekrar deneyin.")
    }
  }

  const handleToggleReady = () => {
    try {
      const socket = getSocket()
      if (!socket || !socket.connected) {
        setError("Sunucu bağlantısı koptu. Lütfen sayfayı yenileyin.")
        return
      }

      const newReadyState = !isReady
      setIsReady(newReadyState)
      socket.emit("player_ready", newReadyState)
    } catch (err) {
      console.error("Error toggling ready state:", err)
      setError("Hazır durumu değiştirilirken bir hata oluştu.")
    }
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

      try {
        const socket = getSocket()
        if (!socket || !socket.connected) {
          setError("Sunucu bağlantısı koptu. Skorunuz kaydedilemeyebilir.")
          return
        }

        const timeElapsed = startTime ? Date.now() - startTime : 0
        socket.emit("game_completed", {
          score,
          incorrectCount,
          timeElapsed,
        })
      } catch (err) {
        console.error("Error completing game:", err)
        setError("Oyun sonucu gönderilirken bir hata oluştu.")
      }
    }
  }

  const handleRestart = () => {
    try {
      const socket = getSocket()
      
      if (!socket || !socket.connected) {
        const newSocket = initializeSocket()
        newSocket.on("connect", () => {
          resetGame(newSocket)
        })
      } else {
        resetGame(socket)
      }
    } catch (err) {
      console.error("Error restarting game:", err)
      setError("Oyun yeniden başlatılırken bir hata oluştu. Lütfen sayfayı yenileyin.")
    }
  }

  const resetGame = (socket: any) => {
    // Önce mevcut oyunu temizle
    socket.emit("cleanup_players")
    socket.emit("reset_game")

    // State'leri sıfırla
    setGameState("name")
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setScore(0)
    setIncorrectCount(0)
    setIsReady(false)
    setStartTime(null)
    setEndTime(null)
    setPlayerName("")
    setPlayers([])
    setLeaderboard([])
    setError("")

    console.log("Game restarted")
  }

  const getColorForMode = (mode: string) => {
    switch (mode) {
      case "Sağlıklı Yetişkin Modu":
        return "bg-gradient-to-r from-emerald-200 to-emerald-300 border-emerald-400 hover:from-emerald-300 hover:to-emerald-400"
      case "Kaygılı Çocuk Modu":
        return "bg-gradient-to-r from-sky-200 to-sky-300 border-sky-400 hover:from-sky-300 hover:to-sky-400"
      case "Kızgın Korungan Çocuk Modu":
        return "bg-gradient-to-r from-rose-200 to-rose-300 border-rose-400 hover:from-rose-300 hover:to-rose-400"
      case "Talepkâr Mod":
        return "bg-gradient-to-r from-violet-200 to-violet-300 border-violet-400 hover:from-violet-300 hover:to-violet-400"
      case "Uyumlu Teslimci Çocuk Modu":
        return "bg-gradient-to-r from-amber-200 to-amber-300 border-amber-400 hover:from-amber-300 hover:to-amber-400"
      default:
        return "bg-gradient-to-r from-gray-200 to-gray-300 border-gray-400 hover:from-gray-300 hover:to-gray-400"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 flex flex-col items-center justify-center">
      {gameState === "rules" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="p-6 shadow-lg backdrop-blur-sm bg-white/80">
            <h1 className="text-2xl font-bold text-center mb-6">{GAME_RULES.title}</h1>
            <div className="space-y-3 mb-6">
              {GAME_RULES.description.map((rule, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-gray-700"
                >
                  {rule}
                </motion.p>
              ))}
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium py-3"
              onClick={handleStartGame}
            >
              Başla
            </Button>
          </Card>
        </motion.div>
      )}

      {gameState === "name" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="p-6 shadow-lg backdrop-blur-sm bg-white/80">
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
            <h2 className="text-xl font-semibold mb-4">Oyuncular Bekleniyor</h2>
            <div className="mb-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {Math.max(0, Math.ceil(waitingTimer / 1000))}
              </div>
              <p className="text-gray-600">saniye içinde oyun başlayacak</p>
            </div>
            <div className="space-y-2 mb-4">
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <span>{player.name}</span>
                  <span className="text-green-500 flex items-center">
                    <Check className="w-4 h-4 mr-1" />
                    Hazır
                  </span>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-gray-600">
              {isMultiplayer ? "Çok oyunculu mod" : "Tek oyunculu mod"}
            </p>
          </Card>
        </motion.div>
      )}

      {gameState === "playing" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Card className="p-6 shadow-lg backdrop-blur-sm bg-white/80">
            <div className="flex justify-between items-center mb-6">
              <motion.div 
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-100 to-yellow-200"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Skor: {score}</span>
              </motion.div>
              <motion.div 
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-blue-200"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">
                  {isMultiplayer ? `${players.length} Oyuncu` : "Tek Oyuncu"}
                </span>
              </motion.div>
              <motion.div 
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-purple-200"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-800">
                  Kalan Süre: {Math.ceil(gameTimer / 1000)}s
                </span>
              </motion.div>
            </div>

            <motion.div 
              className="mb-6 p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-indigo-100"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg font-medium mb-2 text-indigo-900">Soru {currentQuestionIndex + 1}/{questions.length}</h3>
              <p className="text-gray-800 text-lg">{questions[currentQuestionIndex].statement}</p>
            </motion.div>

            <div className="grid grid-cols-1 gap-3 mb-6">
              {questions[currentQuestionIndex].options.map((option) => (
                <motion.div
                  key={option}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Button
                    onClick={() => handleSelectAnswer(option)}
                    disabled={selectedAnswer !== null}
                    className={`w-full justify-between px-6 py-4 text-left rounded-xl border-2 shadow-sm ${
                      selectedAnswer === option
                        ? option === questions[currentQuestionIndex].correctAnswer
                          ? "bg-gradient-to-r from-green-200 to-green-300 border-green-400"
                          : "bg-gradient-to-r from-red-200 to-red-300 border-red-400"
                        : getColorForMode(option)
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-gray-900">{option}</span>
                      {selectedAnswer === option && (
                        <div className="flex items-center">
                          {option === questions[currentQuestionIndex].correctAnswer ? (
                            <div className="flex items-center space-x-2 text-green-800">
                              <Check className="w-5 h-5" />
                              <span className="font-medium">Doğru!</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-red-800">
                              <AlertCircle className="w-5 h-5" />
                              <span className="font-medium">Yanlış</span>
                            </div>
                          )}
                        </div>
                      )}
                      {selectedAnswer && option === questions[currentQuestionIndex].correctAnswer && selectedAnswer !== option && (
                        <div className="flex items-center space-x-2 text-green-800">
                          <Check className="w-5 h-5" />
                          <span className="font-medium">Doğru Cevap</span>
                        </div>
                      )}
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>

            {selectedAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button 
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium py-3"
                  onClick={handleNextQuestion}
                >
                  {currentQuestionIndex < questions.length - 1 ? "Sonraki Soru" : "Oyunu Bitir"}
                </Button>
              </motion.div>
            )}
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
          <Card className="p-6 shadow-lg backdrop-blur-sm bg-white/80">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-center mb-6 text-indigo-900">Tebrikler! 🎉</h2>
            </motion.div>
            <div className="space-y-4 mb-6">
              <motion.div 
                className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-yellow-100"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-yellow-800">Toplam Skor:</span>
                <span className="font-bold text-yellow-900">{score}</span>
              </motion.div>
              <motion.div 
                className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-blue-800">Yanlış Sayısı:</span>
                <span className="font-bold text-blue-900">{incorrectCount}</span>
              </motion.div>
              <motion.div 
                className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-purple-800">Geçen Süre:</span>
                <span className="font-bold text-purple-900">
                  {startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0}s
                </span>
              </motion.div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Skor Tablosu</h3>
              <div className="space-y-3">
                {players.sort((a, b) => (b.score || 0) - (a.score || 0)).map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      player.name === playerName
                        ? "bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`font-bold text-lg ${
                        index === 0 ? "text-yellow-500" :
                        index === 1 ? "text-gray-500" :
                        index === 2 ? "text-amber-600" :
                        "text-gray-400"
                      }`}>
                        #{index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{player.name}</span>
                      {player.name === playerName && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                          Sen
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-gray-700">
                      <span className="font-medium">
                        {player.score || 0} puan
                      </span>
                      <span className="text-sm text-gray-500">
                        {Math.floor((player.timeElapsed || 0) / 1000)}s
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium py-3"
                onClick={handleRestart}
              >
                Yeni Oyun Başlat
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      )}

      {gameState === "leaderboard" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-6 shadow-lg backdrop-blur-sm bg-white/80">
            <h2 className="text-2xl font-bold text-center mb-6 text-indigo-900">Oyun Bitti! 🎮</h2>
            <div className="space-y-3 mb-6">
              {leaderboard.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    player.name === playerName
                      ? "bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-300"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`font-bold text-lg ${
                      index === 0 ? "text-yellow-500" :
                      index === 1 ? "text-gray-500" :
                      index === 2 ? "text-amber-600" :
                      "text-gray-400"
                    }`}>
                      #{index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{player.name}</span>
                    {player.name === playerName && (
                      <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                        Sen
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-gray-700">
                    <span className="font-medium">
                      {player.score || 0} puan
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.floor((player.timeElapsed || 0) / 1000)}s
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium py-3"
                onClick={handleRestart}
              >
                Yeni Oyun Başlat
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      )}
    </div>
  )
} 