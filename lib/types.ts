export interface Player {
  id: string
  name: string
  score?: number
  incorrectCount?: number
  isReady?: boolean
  isFinished?: boolean
  timeElapsed?: number
}

export interface GameSession {
  id: string
  players: Player[]
  status: "waiting" | "playing" | "finished"
  startTime?: number
  endTime?: number
}

