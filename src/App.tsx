/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import WalletConnect from './components/WalletConnect';
import GameScreen from './components/GameScreen';

export default function App() {
  const [playerAddress, setPlayerAddress] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      {!playerAddress ? (
        <WalletConnect onConnect={setPlayerAddress} />
      ) : (
        <GameScreen playerAddress={playerAddress} />
      )}
    </div>
  );
}
