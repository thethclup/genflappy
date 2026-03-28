/// <reference types="vite/client" />
import { createClient, chains } from 'genlayer-js';

// We'll use a mock fallback if the client fails to initialize or if we're in a dev environment without a contract
let client: any;
try {
  client = createClient({ chain: chains.testnetBradbury });
} catch (e) {
  console.warn('Failed to initialize genlayer client, using mock fallback', e);
}

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

// Mock state for local testing if contract is not available
const mockState = {
  theme: "A validator bird navigates the treacherous mempool of the Bradbury testnet.",
  stats: {
    best_score: 0,
    total_games: 0,
    total_pipes: 0,
    last_theme: "",
    last_report: ""
  },
  leaderboard: [
    { rank: 1, address: "0x1234...5678", score: 42, verdict: "LEGENDARY" }
  ]
};

export async function startGame(player: string): Promise<string> {
  if (client && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
    try {
      // Assuming client has a write method
      const tx = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'start_game',
        args: [player],
        account: player
      });
      // In a real scenario, we might need to wait for tx and parse events/return value
      // For now, we'll return a mock theme if we can't get the return value easily
      return "A validator bird navigates the treacherous mempool of the Bradbury testnet.";
    } catch (e: any) {
      if (e.message?.includes('can not get contract state') || e.message?.includes('running contract failed') || e.message?.includes('gen_call') || e.details?.includes('can not get contract state')) {
        console.warn(`Contract ${CONTRACT_ADDRESS} not found or invalid on Bradbury testnet. Please deploy contracts/genflappy.py and update VITE_CONTRACT_ADDRESS in .env.local. Using mock data.`);
      } else {
        console.error('Error in startGame:', e);
      }
    }
  }
  
  // Fallback
  return new Promise(resolve => setTimeout(() => resolve(mockState.theme), 1500));
}

export async function submitCheckpoint(player: string, score: number, checkpointId: number): Promise<string> {
  if (client && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
    try {
      await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'submit_checkpoint',
        args: [player, score, checkpointId],
        account: player
      });
    } catch (e: any) {
      if (e.message?.includes('can not get contract state') || e.message?.includes('running contract failed') || e.message?.includes('gen_call') || e.details?.includes('can not get contract state')) {
        console.warn(`Contract ${CONTRACT_ADDRESS} not found or invalid on Bradbury testnet. Please deploy contracts/genflappy.py and update VITE_CONTRACT_ADDRESS in .env.local. Using mock data.`);
      } else {
        console.error('Error in submitCheckpoint:', e);
      }
    }
  }
  
  // Fallback
  return new Promise(resolve => setTimeout(() => {
    const isBoost = Math.random() > 0.5;
    resolve(`VERDICT: ${isBoost ? 'boost' : 'penalty'}\nAMOUNT: ${Math.floor(Math.random() * 20) + 5}\nREASON: The AI consensus nodes favored your bold trajectory.`);
  }, 1000));
}

export async function submitScore(player: string, score: number, pipes: number, seconds: number): Promise<string> {
  if (client && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
    try {
      await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'submit_score',
        args: [player, score, pipes, seconds],
        account: player
      });
    } catch (e: any) {
      if (e.message?.includes('can not get contract state') || e.message?.includes('running contract failed') || e.message?.includes('gen_call') || e.details?.includes('can not get contract state')) {
        console.warn(`Contract ${CONTRACT_ADDRESS} not found or invalid on Bradbury testnet. Please deploy contracts/genflappy.py and update VITE_CONTRACT_ADDRESS in .env.local. Using mock data.`);
      } else {
        console.error('Error in submitScore:', e);
      }
    }
  }
  
  // Fallback
  return new Promise(resolve => setTimeout(() => {
    mockState.stats.total_games++;
    mockState.stats.total_pipes += pipes;
    if (score > mockState.stats.best_score) mockState.stats.best_score = score;
    
    const verdicts = ["LEGENDARY", "EPIC", "DECENT", "ROOKIE", "DISASTROUS"];
    const verdict = verdicts[Math.floor(Math.random() * verdicts.length)];
    const report = `The bird navigated ${pipes} consensus nodes over ${seconds} seconds, achieving a score of ${score}. The network has reached finality on this attempt.\n${verdict}`;
    mockState.stats.last_report = report;
    
    resolve(report);
  }, 2000));
}

export async function getFlightReport(player: string): Promise<string> {
  if (client && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
    try {
      const result = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: 'get_flight_report',
        args: [player]
      });
      return result as string;
    } catch (e: any) {
      if (e.message?.includes('can not get contract state') || e.message?.includes('running contract failed') || e.message?.includes('gen_call') || e.details?.includes('can not get contract state')) {
        console.warn(`Contract ${CONTRACT_ADDRESS} not found or invalid on Bradbury testnet. Please deploy contracts/genflappy.py and update VITE_CONTRACT_ADDRESS in .env.local. Using mock data.`);
      } else {
        console.error('Error in getFlightReport:', e);
      }
    }
  }
  
  // Fallback
  return mockState.stats.last_report || "No flights recorded yet.\nVERDICT: UNRANKED";
}

export async function getLeaderboard(): Promise<string> {
  if (client && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
    try {
      const result = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: 'get_leaderboard'
      });
      return result as string;
    } catch (e: any) {
      if (e.message?.includes('can not get contract state') || e.message?.includes('running contract failed') || e.message?.includes('gen_call') || e.details?.includes('can not get contract state')) {
        console.warn(`Contract ${CONTRACT_ADDRESS} not found or invalid on Bradbury testnet. Please deploy contracts/genflappy.py and update VITE_CONTRACT_ADDRESS in .env.local. Using mock data.`);
      } else {
        console.error('Error in getLeaderboard:', e);
      }
    }
  }
  
  // Fallback
  return JSON.stringify(mockState.leaderboard);
}

export async function getPlayerStats(player: string): Promise<string> {
  if (client && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
    try {
      const result = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: 'get_player_stats',
        args: [player]
      });
      return result as string;
    } catch (e: any) {
      if (e.message?.includes('can not get contract state') || e.message?.includes('running contract failed') || e.message?.includes('gen_call') || e.details?.includes('can not get contract state')) {
        console.warn(`Contract ${CONTRACT_ADDRESS} not found or invalid on Bradbury testnet. Please deploy contracts/genflappy.py and update VITE_CONTRACT_ADDRESS in .env.local. Using mock data.`);
      } else {
        console.error('Error in getPlayerStats:', e);
      }
    }
  }
  
  // Fallback
  return JSON.stringify({
    address: player,
    ...mockState.stats
  });
}

export async function getTotalGames(): Promise<number> {
  if (client && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
    try {
      const result = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: 'get_total_games'
      });
      return Number(result);
    } catch (e: any) {
      if (e.message?.includes('can not get contract state') || e.message?.includes('running contract failed') || e.message?.includes('gen_call') || e.details?.includes('can not get contract state')) {
        console.warn(`Contract ${CONTRACT_ADDRESS} not found or invalid on Bradbury testnet. Please deploy contracts/genflappy.py and update VITE_CONTRACT_ADDRESS in .env.local. Using mock data.`);
      } else {
        console.error('Error in getTotalGames:', e);
      }
    }
  }
  
  // Fallback
  return mockState.stats.total_games;
}
