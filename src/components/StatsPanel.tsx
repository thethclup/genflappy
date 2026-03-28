import React, { useEffect, useState } from 'react';
import { getPlayerStats } from '../lib/genlayer';

interface StatsPanelProps {
  playerAddress: string;
  currentScore: number;
  currentPipes: number;
  currentTheme: string;
  gameState: string;
}

export default function StatsPanel({ playerAddress, currentScore, currentPipes, currentTheme, gameState }: StatsPanelProps) {
  const [stats, setStats] = useState<{best_score: number, total_games: number, total_pipes: number} | null>(null);

  useEffect(() => {
    if (gameState === 'idle' || gameState === 'dead') {
      getPlayerStats(playerAddress).then(res => {
        try {
          setStats(JSON.parse(res));
        } catch (e) {
          console.error(e);
        }
      });
    }
  }, [playerAddress, gameState]);

  return (
    <div className="p-4 border-b border-[#1a3a2a]">
      <h3 className="text-[#00e5ff] font-['Press_Start_2P'] text-xs mb-4">LIVE TELEMETRY</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-black border border-[#1a3a2a] p-3 rounded">
          <p className="text-gray-500 text-[10px] mb-1">CURRENT SCORE</p>
          <p className="text-2xl text-white font-['Press_Start_2P']">{currentScore}</p>
        </div>
        <div className="bg-black border border-[#1a3a2a] p-3 rounded">
          <p className="text-gray-500 text-[10px] mb-1">PIPES PASSED</p>
          <p className="text-2xl text-white font-['Press_Start_2P']">{currentPipes}</p>
        </div>
      </div>

      <div className="bg-black border border-[#1a3a2a] p-3 rounded mb-4">
        <p className="text-gray-500 text-[10px] mb-1">ACTIVE THEME</p>
        <p className="text-sm text-[#a855f7] italic">
          {currentTheme || "Awaiting consensus..."}
        </p>
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <p>BEST: <span className="text-[#fbbf24] font-['Press_Start_2P'] text-[10px]">{stats?.best_score || 0}</span></p>
        <p>FLIGHTS: <span className="text-white font-['Press_Start_2P'] text-[10px]">{stats?.total_games || 0}</span></p>
      </div>
    </div>
  );
}
