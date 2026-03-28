import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../lib/genlayer';

interface LeaderboardEntry {
  rank: number;
  address: string;
  score: number;
  verdict?: string;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await getLeaderboard();
        setEntries(JSON.parse(res));
      } catch (e) {
        console.error("Failed to fetch leaderboard", e);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const getVerdictBadge = (verdict?: string) => {
    if (!verdict) return null;
    
    let colorClass = "bg-gray-800 text-gray-400 border-gray-600";
    
    if (verdict === "LEGENDARY") colorClass = "bg-[#fbbf24]/20 text-[#fbbf24] border-[#fbbf24]";
    if (verdict === "EPIC") colorClass = "bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]";
    if (verdict === "DECENT") colorClass = "bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]";
    if (verdict === "DISASTROUS") colorClass = "bg-[#ff3d00]/20 text-[#ff3d00] border-[#ff3d00]";
    
    return (
      <span className={`text-[8px] px-1 py-0.5 border rounded ${colorClass}`}>
        {verdict}
      </span>
    );
  };

  return (
    <div className="p-4 flex-1 overflow-y-auto">
      <h3 className="text-[#00e5ff] font-['Press_Start_2P'] text-xs mb-4">TOP VALIDATORS</h3>
      
      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-gray-600 text-sm italic">No flights recorded yet.</p>
        ) : (
          entries.map((entry, i) => (
            <div key={i} className="bg-black border border-[#1a3a2a] p-3 rounded flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-['Press_Start_2P'] text-[10px]">#{entry.rank || i + 1}</span>
                <div>
                  <p className="text-sm">{entry.address.slice(0, 6)}...{entry.address.slice(-4)}</p>
                  <div className="mt-1">
                    {getVerdictBadge(entry.verdict)}
                  </div>
                </div>
              </div>
              <span className="text-[#fbbf24] font-['Press_Start_2P'] text-sm">{entry.score}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
