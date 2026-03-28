import React, { useState, useEffect } from 'react';

export default function WalletConnect({ onConnect }: { onConnect: (address: string) => void }) {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          onConnect(accounts[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          onConnect(accounts[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to connect wallet');
      }
    } else {
      setError('Please install MetaMask to play GenFlappy.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a1a] text-white font-['Press_Start_2P']">
      <h1 className="text-4xl md:text-6xl text-[#00e5ff] mb-4 text-center drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]">GenFlappy</h1>
      <p className="text-[#a855f7] mb-12 text-sm md:text-base text-center">AI Validator Bird on GenLayer</p>
      
      {!address ? (
        <button 
          onClick={connectWallet}
          className="px-6 py-4 bg-[#1a3a2a] border-2 border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff] hover:text-[#0a0a1a] transition-colors shadow-[0_0_15px_rgba(0,229,255,0.5)] uppercase tracking-wider"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="text-center">
          <p className="mb-6 text-xs md:text-sm opacity-80">Connected: {address.slice(0, 6)}...{address.slice(-4)}</p>
          <button 
            onClick={() => onConnect(address)}
            className="px-6 py-4 bg-[#1a3a2a] border-2 border-[#a855f7] text-[#a855f7] hover:bg-[#a855f7] hover:text-[#0a0a1a] transition-colors shadow-[0_0_15px_rgba(168,85,247,0.5)] uppercase tracking-wider"
          >
            Enter Mempool
          </button>
        </div>
      )}
      
      {error && <p className="mt-6 text-[#ff3d00] text-xs max-w-md text-center leading-relaxed">{error}</p>}
    </div>
  );
}
