GenFlappy is a fun, addictive blockchain gaming dApp built specifically for GenLayer's Bradbury testnet.
It combines the ultra-simple and highly engaging mechanics of the classic Flappy Bird with the revolutionary capabilities of GenLayer's Intelligent Contracts — AI-powered smart contracts that use Large Language Models (LLMs) and Optimistic Democracy consensus to handle non-deterministic, subjective decisions on-chain.
Core Concept
You play as the Validator Bird flying through endless "Dispute Pipes" (the classic pipes rethemed as blockchain disputes). The game runs smoothly client-side using HTML5 Canvas, but every critical moment triggers real on-chain transactions to GenLayer's Intelligent Contracts.
Gameplay & Blockchain Integration

Start Flight (Tx 1): Connect your wallet and call startGame(). The Intelligent Contract uses an LLM to generate a unique, randomized "flight theme" (e.g., “You are flying through Arbitrum layers while dodging Optimistic Disputes”). This theme dynamically changes the visuals and atmosphere of the game for high replayability.
Play: Classic Flappy Bird controls — tap/click/space to flap and avoid pipes. The game feels fast and responsive.
AI Boost / Checkpoint (Optional Tx 2): At certain score intervals, you can request an "AI Boost". The contract asks the LLM a subjective question like “Is this Validator Bird brave enough?” and grants score bonuses, penalties, or fun narrative twists.
Game Over & Score Submit (Tx 3): When you crash, submit your final score and flight time. The Intelligent Contract generates a creative, poetic "Flight Report" using LLM consensus — for example: “Validator Bird soared 87 points through 42 disputes. Optimistic Democracy has declared this flight Legendary!”

Additional transactions can include claiming daily challenges, viewing AI-ranked leaderboards (where the LLM subjectively judges “most epic flights”), or starting a rematch with a fresh theme.
Why It Fits GenLayer Bradbury Perfectly
GenLayer is the first AI-native blockchain. Its Intelligent Contracts (written in Python) can access the web in real-time, process natural language, and make subjective judgments through Optimistic Democracy — a consensus where multiple validators run different LLMs and reach agreement via the Equivalence Principle.
GenFlappy maximizes transaction volume: an average player generates 3–5+ transactions per session, creating real stress testing for the testnet while delivering entertaining gameplay. Every LLM call demonstrates non-deterministic execution in action.
Additional Features

On-chain storage of flight reports
Simple NFT-style minting of memorable flights (free on testnet)
Leaderboards with AI-judged “epicness”
Point farming potential through active participation in the incentivized Bradbury testnet

GenFlappy is designed to be easy to build: Intelligent Contract in Python using GenLayer SDK, frontend with Next.js + genlayer-js and vanilla Canvas. It serves as both a delightful casual game and a practical showcase of how AI can bring subjectivity, creativity, and real-world adaptability into blockchain applications.
