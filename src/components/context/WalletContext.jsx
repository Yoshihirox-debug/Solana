import React, { createContext, useContext, useState } from 'react';

const WalletContext = createContext(null);

function genSolAddress() {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return Array.from({ length: 44 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [mode, setModeState] = useState('simulation');

  const connect = async (walletId) => {
    // Try real Phantom
    if (walletId === 'phantom') {
      const provider = window?.phantom?.solana || window?.solana;
      if (provider?.isPhantom) {
        try {
          const { publicKey } = await provider.connect();
          setWallet({ id: 'phantom', name: 'Phantom', color: 'from-purple-500 to-purple-700', address: publicKey.toString(), balance: (Math.random() * 8 + 0.5).toFixed(4), real: true });
          return { success: true };
        } catch {}
      }
    }
    // Try real Solflare
    if (walletId === 'solflare' && window?.solflare?.isSolflare) {
      try {
        await window.solflare.connect();
        if (window.solflare.publicKey) {
          setWallet({ id: 'solflare', name: 'Solflare', color: 'from-orange-400 to-orange-600', address: window.solflare.publicKey.toString(), balance: (Math.random() * 8 + 0.5).toFixed(4), real: true });
          return { success: true };
        }
      } catch {}
    }

    // Mock connection for all wallets
    const info = {
      phantom: { name: 'Phantom', color: 'from-purple-500 to-purple-700' },
      solflare: { name: 'Solflare', color: 'from-orange-400 to-orange-600' },
      backpack: { name: 'Backpack', color: 'from-zinc-500 to-zinc-700' },
      glow: { name: 'Glow', color: 'from-yellow-400 to-yellow-600' },
      metamask: { name: 'MetaMask', color: 'from-orange-400 to-orange-500' },
      trust: { name: 'Trust Wallet', color: 'from-blue-500 to-blue-700' },
      coinbase: { name: 'Coinbase', color: 'from-blue-400 to-blue-600' },
      walletconnect: { name: 'WalletConnect', color: 'from-cyan-500 to-cyan-700' },
    }[walletId] || { name: walletId, color: 'from-gray-500 to-gray-700' };

    setWallet({ id: walletId, ...info, address: genSolAddress(), balance: (Math.random() * 8 + 0.5).toFixed(4), real: false });
    return { success: true };
  };

  const disconnect = () => {
    try {
      const p = window?.phantom?.solana || window?.solana;
      if (p?.isPhantom && p?.isConnected) p.disconnect();
      if (window?.solflare?.isConnected) window.solflare.disconnect();
    } catch {}
    setWallet(null);
    setModeState('simulation');
  };

  const setMode = (m) => {
    if (m === 'real' && !wallet) return;
    setModeState(m);
  };

  return (
    <WalletContext.Provider value={{ wallet, mode, setMode, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) return { wallet: null, mode: 'simulation', setMode: () => {}, connect: async () => {}, disconnect: () => {} };
  return ctx;
};