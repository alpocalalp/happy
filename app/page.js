"use client"

import { useState } from 'react'

export default function Home() {
  const [playerName, setPlayerName] = useState("")

  const handleJoinGame = () => {
    console.log("Joining game as:", playerName)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Thought Matching Game</h1>
        <p className="mb-4">Enter your name to join the game</p>
        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="Your name" 
            className="flex h-10 w-full rounded-md border px-3 py-2"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
            onClick={handleJoinGame}
          >
            Join
          </button>
        </div>
      </div>
    </main>
  )
} 