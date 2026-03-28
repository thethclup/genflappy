import React, { useRef, useEffect, useState } from 'react';

type GameState = "idle" | "theme_loading" | "playing" | "dead" | "report_loading";

interface GameCanvasProps {
  gameState: GameState;
  theme: string;
  onGameOver: (score: number, pipes: number, seconds: number) => void;
  onBoost: (score: number, checkpointId: number) => Promise<string | null>;
}

export default function GameCanvas({ gameState, theme, onGameOver, onBoost }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const [boostVerdict, setBoostVerdict] = useState<{text: string, amount: number, isBoost: boolean} | null>(null);
  
  // Game state refs to avoid dependency issues in animation loop
  const stateRef = useRef({
    bird: { x: 80, y: 320, velocity: 0, width: 34, height: 24, hitboxW: 28, hitboxH: 20 },
    pipes: [] as { x: number, topHeight: number, bottomY: number, passed: boolean, label: string }[],
    score: 0,
    pipesPassed: 0,
    frames: 0,
    startTime: 0,
    pipeSpeed: 2.5,
    isGameOver: false,
    themeColor: '#00e5ff'
  });

  // Determine theme color
  useEffect(() => {
    const t = theme.toLowerCase();
    let color = '#00e5ff'; // default blue
    if (t.includes('zero knowledge') || t.includes('zk')) color = '#a855f7'; // purple
    else if (t.includes('gas') || t.includes('war')) color = '#fbbf24'; // orange/yellow
    else if (t.includes('mev') || t.includes('slash')) color = '#ff3d00'; // red
    
    stateRef.current.themeColor = color;
  }, [theme]);

  // Reset game state when starting
  useEffect(() => {
    if (gameState === 'playing' && stateRef.current.isGameOver) {
      stateRef.current = {
        ...stateRef.current,
        bird: { ...stateRef.current.bird, y: 320, velocity: 0 },
        pipes: [],
        score: 0,
        pipesPassed: 0,
        frames: 0,
        startTime: Date.now(),
        pipeSpeed: 2.5,
        isGameOver: false
      };
    } else if (gameState === 'playing' && stateRef.current.startTime === 0) {
      stateRef.current.startTime = Date.now();
    }
  }, [gameState]);

  // Handle input
  useEffect(() => {
    const handleFlap = (e: KeyboardEvent | MouseEvent | TouchEvent) => {
      if (gameState !== 'playing' || isBoosting) return;
      
      if (e.type === 'keydown' && (e as KeyboardEvent).code !== 'Space') return;
      
      // Prevent default scrolling for spacebar
      if (e.type === 'keydown') e.preventDefault();
      
      stateRef.current.bird.velocity = -7;
    };

    window.addEventListener('keydown', handleFlap);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousedown', handleFlap);
      canvas.addEventListener('touchstart', handleFlap, { passive: false });
    }

    return () => {
      window.removeEventListener('keydown', handleFlap);
      if (canvas) {
        canvas.removeEventListener('mousedown', handleFlap);
        canvas.removeEventListener('touchstart', handleFlap);
      }
    };
  }, [gameState, isBoosting]);

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const state = stateRef.current;
      
      // Clear canvas
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw background elements based on theme color
      ctx.fillStyle = state.themeColor + '11'; // 11 is hex for low opacity
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(
          ((state.frames * 0.5) + i * 100) % canvas.width, 
          canvas.height - 100 + Math.sin(state.frames * 0.05 + i) * 20, 
          80, 80
        );
      }

      if (gameState === 'playing' && !isBoosting && !state.isGameOver) {
        // Update bird
        state.bird.velocity += 0.4; // gravity
        state.bird.y += state.bird.velocity;

        // Spawn pipes
        if (state.frames % 90 === 0) {
          const gap = 160;
          const minPipeHeight = 80;
          const maxTopHeight = canvas.height - gap - minPipeHeight;
          const topHeight = Math.floor(Math.random() * (maxTopHeight - minPipeHeight + 1) + minPipeHeight);
          
          const labels = ["ZK PIPE", "MEV PIPE", "DAO PIPE", "L2 PIPE", "GAS PIPE"];
          const label = labels[Math.floor(Math.random() * labels.length)];
          
          state.pipes.push({
            x: canvas.width,
            topHeight,
            bottomY: topHeight + gap,
            passed: false,
            label
          });
          
          // Increase speed slightly every 5 pipes
          if (state.pipesPassed > 0 && state.pipesPassed % 5 === 0) {
            state.pipeSpeed += 0.1;
          }
        }

        // Update pipes
        for (let i = state.pipes.length - 1; i >= 0; i--) {
          const p = state.pipes[i];
          p.x -= state.pipeSpeed;

          // Check pass
          if (!p.passed && state.bird.x > p.x + 52) {
            p.passed = true;
            state.score += 1;
            state.pipesPassed += 1;
          }

          // Check collision
          const birdHitbox = {
            x: state.bird.x + (state.bird.width - state.bird.hitboxW) / 2,
            y: state.bird.y + (state.bird.height - state.bird.hitboxH) / 2,
            w: state.bird.hitboxW,
            h: state.bird.hitboxH
          };

          const hitTop = birdHitbox.x < p.x + 52 && birdHitbox.x + birdHitbox.w > p.x && birdHitbox.y < p.topHeight;
          const hitBottom = birdHitbox.x < p.x + 52 && birdHitbox.x + birdHitbox.w > p.x && birdHitbox.y + birdHitbox.h > p.bottomY;

          if (hitTop || hitBottom) {
            state.isGameOver = true;
          }

          // Remove off-screen pipes
          if (p.x < -52) {
            state.pipes.splice(i, 1);
          }
        }

        // Check floor/ceiling collision
        if (state.bird.y < 0 || state.bird.y + state.bird.height > canvas.height) {
          state.isGameOver = true;
        }

        if (state.isGameOver) {
          const seconds = Math.floor((Date.now() - state.startTime) / 1000);
          onGameOver(state.score, state.pipesPassed, seconds);
        }

        state.frames++;
      }

      // Draw pipes
      state.pipes.forEach(p => {
        // Top pipe
        ctx.fillStyle = '#1a3a2a';
        ctx.fillRect(p.x, 0, 52, p.topHeight);
        ctx.strokeStyle = state.themeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, 0, 52, p.topHeight);
        
        // Bottom pipe
        ctx.fillRect(p.x, p.bottomY, 52, canvas.height - p.bottomY);
        ctx.strokeRect(p.x, p.bottomY, 52, canvas.height - p.bottomY);
        
        // Pipe labels
        ctx.fillStyle = state.themeColor;
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'center';
        
        // Draw label on bottom pipe if there's room
        if (canvas.height - p.bottomY > 40) {
          ctx.fillText(p.label, p.x + 26, p.bottomY + 20);
        }
      });

      // Draw bird
      ctx.fillStyle = '#fbbf24'; // golden yellow
      
      // Flap animation
      const flapOffset = (state.frames % 10 < 5) ? 2 : -2;
      
      // Body
      ctx.beginPath();
      ctx.roundRect(state.bird.x, state.bird.y, state.bird.width, state.bird.height, 8);
      ctx.fill();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Eye
      ctx.fillStyle = 'white';
      ctx.fillRect(state.bird.x + 22, state.bird.y + 4, 6, 6);
      ctx.fillStyle = 'black';
      ctx.fillRect(state.bird.x + 25, state.bird.y + 6, 2, 2);
      
      // Wing
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(state.bird.x + 4, state.bird.y + 10 + flapOffset, 14, 8, 4);
      ctx.fill();

      // Draw Score
      if (gameState === 'playing' || gameState === 'dead' || gameState === 'report_loading') {
        ctx.fillStyle = 'white';
        ctx.font = '30px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(state.score.toString(), canvas.width / 2, 60);
        ctx.fillText(state.score.toString(), canvas.width / 2, 60);
      }
      
      // Draw Boost Verdict Overlay
      if (boostVerdict) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = 'center';
        ctx.font = '20px "Press Start 2P"';
        ctx.fillStyle = boostVerdict.isBoost ? '#00e5ff' : '#ff3d00';
        ctx.fillText(boostVerdict.isBoost ? 'BOOST GRANTED' : 'PENALTY APPLIED', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '16px "Press Start 2P"';
        ctx.fillStyle = 'white';
        ctx.fillText(`${boostVerdict.isBoost ? '+' : '-'}${boostVerdict.amount} POINTS`, canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.font = '10px "JetBrains Mono"';
        ctx.fillStyle = '#a855f7';
        // Wrap text roughly
        const words = boostVerdict.text.split(' ');
        let line = '';
        let y = canvas.height / 2 + 60;
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > canvas.width - 40 && i > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = words[i] + ' ';
            y += 16;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, canvas.width / 2, y);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, isBoosting, boostVerdict, onGameOver]);

  const handleBoostClick = async () => {
    if (gameState !== 'playing' || isBoosting || stateRef.current.isGameOver) return;
    
    setIsBoosting(true);
    const checkpointId = stateRef.current.pipesPassed;
    const result = await onBoost(stateRef.current.score, checkpointId);
    
    if (result) {
      // Parse result: VERDICT: [boost/penalty] \n AMOUNT: [number] \n REASON: [text]
      try {
        const verdictMatch = result.match(/VERDICT:\s*(boost|penalty)/i);
        const amountMatch = result.match(/AMOUNT:\s*(\d+)/i);
        const reasonMatch = result.match(/REASON:\s*(.+)/i);
        
        const isBoost = verdictMatch ? verdictMatch[1].toLowerCase() === 'boost' : true;
        const amount = amountMatch ? parseInt(amountMatch[1]) : 10;
        const reason = reasonMatch ? reasonMatch[1] : result;
        
        setBoostVerdict({ text: reason, amount, isBoost });
        
        // Apply score change
        if (isBoost) {
          stateRef.current.score += amount;
        } else {
          stateRef.current.score = Math.max(0, stateRef.current.score - amount);
        }
        
        // Hide overlay after 3 seconds and resume
        setTimeout(() => {
          setBoostVerdict(null);
          setIsBoosting(false);
        }, 3000);
      } catch (e) {
        console.error("Failed to parse boost result", e);
        setIsBoosting(false);
      }
    } else {
      setIsBoosting(false);
    }
  };

  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        width={480} 
        height={640} 
        className="block max-w-full h-auto"
        style={{ touchAction: 'none' }}
      />
      
      {gameState === 'playing' && !isBoosting && (
        <button 
          onClick={handleBoostClick}
          className="absolute bottom-4 right-4 px-4 py-2 bg-[#a855f7] text-white font-['Press_Start_2P'] text-[10px] rounded border-2 border-white shadow-[0_0_10px_rgba(168,85,247,0.8)] hover:bg-white hover:text-[#a855f7] transition-colors z-20"
        >
          AI BOOST
        </button>
      )}
    </div>
  );
}
