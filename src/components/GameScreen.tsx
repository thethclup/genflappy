import React, { useState, useEffect } from 'react';
import GameCanvas from './GameCanvas';
import StatsPanel from './StatsPanel';
import Leaderboard from './Leaderboard';
import { startGame, submitScore, submitCheckpoint } from '../lib/genlayer';

type GameState = "idle" | "theme_loading" | "playing" | "dead" | "report_loading";

export default function GameScreen({ playerAddress }: { playerAddress: string }) {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [theme, setTheme] = useState<string>("");
  const [report, setReport] = useState<string>("");
  const [score, setScore] = useState(0);
  const [pipes, setPipes] = useState(0);
  const [flightSeconds, setFlightSeconds] = useState(0);
  const [toasts, setToasts] = useState<{id: number, msg: string, type: 'info' | 'success' | 'loading'}[]>([]);
  
  const addToast = (msg: string, type: 'info' | 'success' | 'loading') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    if (type !== 'loading') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    }
    return id;
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleStartFlight = async () => {
    setGameState("theme_loading");
    setReport("");
    setScore(0);
    setPipes(0);
    setFlightSeconds(0);
    
    const toastId = addToast("📡 TX Sent: Generating Theme...", "loading");
    try {
      const newTheme = await startGame(playerAddress);
      setTheme(newTheme);
      removeToast(toastId);
      addToast("✅ Confirmed: Theme Generated", "success");
      setGameState("playing");
    } catch (err) {
      console.error(err);
      removeToast(toastId);
      addToast("Failed to generate theme", "info");
      setGameState("idle");
    }
  };

  const handleGameOver = async (finalScore: number, finalPipes: number, finalSeconds: number) => {
    setGameState("dead");
    setScore(finalScore);
    setPipes(finalPipes);
    setFlightSeconds(finalSeconds);
    
    setGameState("report_loading");
    const toastId = addToast("📡 TX Sent: Submitting Score...", "loading");
    
    try {
      const newReport = await submitScore(playerAddress, finalScore, finalPipes, finalSeconds);
      setReport(newReport);
      removeToast(toastId);
      addToast("✅ Confirmed: Report Generated", "success");
      setGameState("dead");
    } catch (err) {
      console.error(err);
      removeToast(toastId);
      addToast("Failed to submit score", "info");
      setGameState("dead");
    }
  };

  const handleBoost = async (currentScore: number, checkpointId: number) => {
    const toastId = addToast("📡 TX Sent: Requesting AI Boost...", "loading");
    try {
      const result = await submitCheckpoint(playerAddress, currentScore, checkpointId);
      removeToast(toastId);
      addToast("✅ Confirmed: AI Ruling", "success");
      return result;
    } catch (err) {
      console.error(err);
      removeToast(toastId);
      addToast("Failed to get boost", "info");
      return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-[#0a0a1a] text-white font-['JetBrains_Mono'] overflow-hidden">
      {/* Background Parallax Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwYTBhMWEiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDBlNWZmIiBvcGFjaXR5PSIwLjMiLz48L3N2Zz4=')]"></div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 z-10 relative">
        <h1 className="text-2xl md:text-4xl text-[#00e5ff] mb-4 font-['Press_Start_2P'] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)] text-center">
          GenFlappy
        </h1>
        
        <div className="relative border-4 border-[#1a3a2a] shadow-[0_0_30px_rgba(0,229,255,0.2)] rounded-lg overflow-hidden bg-black">
          <GameCanvas 
            gameState={gameState} 
            theme={theme} 
            onGameOver={handleGameOver}
            onBoost={handleBoost}
          />
          
          {gameState === "idle" && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-[#a855f7] mb-8 max-w-xs leading-relaxed">Navigate the mempool. Avoid the dispute pipes. Seek consensus.</p>
              <button 
                onClick={handleStartFlight}
                className="px-6 py-4 bg-[#1a3a2a] border-2 border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff] hover:text-[#0a0a1a] transition-colors font-['Press_Start_2P'] text-sm"
              >
                START FLIGHT
              </button>
            </div>
          )}
          
          {gameState === "theme_loading" && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-[#00e5ff] animate-pulse font-['Press_Start_2P'] text-xs leading-loose">
                GENERATING<br/>FLIGHT THEME...
              </p>
            </div>
          )}
          
          {(gameState === "dead" || gameState === "report_loading") && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center z-50">
              <h2 className="text-4xl text-[#ff3d00] font-['Press_Start_2P'] mb-2 drop-shadow-[0_0_10px_rgba(255,61,0,0.8)]">CRASHED</h2>
              <p className="text-2xl text-white mb-8 font-['Press_Start_2P']">SCORE: {score}</p>
              
              {gameState === "report_loading" ? (
                <div className="flex flex-col items-center">
                  <div className="flex space-x-2 mb-4">
                    <div className="w-3 h-3 bg-[#a855f7] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-[#a855f7] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-[#a855f7] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-[#a855f7] text-xs font-['Press_Start_2P']">AWAITING LLM REPORT...</p>
                </div>
              ) : (
                <button 
                  onClick={handleStartFlight}
                  className="px-6 py-4 bg-[#1a3a2a] border-2 border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff] hover:text-[#0a0a1a] transition-colors font-['Press_Start_2P'] text-sm mt-4"
                >
                  FLY AGAIN
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-96 bg-[#0f0f1a] border-l border-[#1a3a2a] flex flex-col z-10 h-auto lg:h-screen overflow-y-auto">
        <StatsPanel 
          playerAddress={playerAddress} 
          currentScore={score} 
          currentPipes={pipes} 
          currentTheme={theme} 
          gameState={gameState}
        />
        
        {/* Report Panel */}
        <div className="p-4 border-b border-[#1a3a2a]">
          <h3 className="text-[#00e5ff] font-['Press_Start_2P'] text-xs mb-4">AI FLIGHT REPORT</h3>
          <div className="bg-black border border-[#1a3a2a] p-4 rounded min-h-[120px] relative">
            {gameState === "report_loading" && (
              <p className="text-gray-500 animate-pulse text-sm">Analyzing flight telemetry...</p>
            )}
            {report && gameState !== "report_loading" && (
              <div className="text-sm leading-relaxed text-[#a855f7]">
                {report.split('\n').map((line, i) => {
                  // Highlight the verdict word
                  if (line.match(/LEGENDARY|EPIC|DECENT|ROOKIE|DISASTROUS/)) {
                    const verdict = line.match(/LEGENDARY|EPIC|DECENT|ROOKIE|DISASTROUS/)?.[0];
                    let color = "text-gray-400";
                    if (verdict === "LEGENDARY") color = "text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]";
                    if (verdict === "EPIC") color = "text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]";
                    if (verdict === "DECENT") color = "text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]";
                    if (verdict === "DISASTROUS") color = "text-[#ff3d00] drop-shadow-[0_0_8px_rgba(255,61,0,0.8)]";
                    
                    return (
                      <p key={i} className="mt-4 font-['Press_Start_2P'] text-center">
                        <span className={color}>{line}</span>
                      </p>
                    );
                  }
                  return <p key={i} className="mb-2">{line}</p>;
                })}
              </div>
            )}
            {!report && gameState !== "report_loading" && (
              <p className="text-gray-600 text-sm italic">No report generated yet.</p>
            )}
          </div>
        </div>
        
        <Leaderboard />
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`p-3 rounded border text-sm font-['JetBrains_Mono'] shadow-lg flex items-center gap-3 transform transition-all translate-x-0
              ${t.type === 'loading' ? 'bg-[#1a1a0a] border-[#fbbf24] text-[#fbbf24]' : 
                t.type === 'success' ? 'bg-[#0a1a1a] border-[#00e5ff] text-[#00e5ff]' : 
                'bg-[#1a0a0a] border-[#ff3d00] text-[#ff3d00]'}`}
          >
            {t.type === 'loading' && <div className="w-4 h-4 border-2 border-[#fbbf24] border-t-transparent rounded-full animate-spin"></div>}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
