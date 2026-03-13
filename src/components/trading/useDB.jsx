const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Returns the correct data layer based on mode:
// - simulation → localStorage (100% offline, works on your PC without a server)
// - real → base44 cloud DB

import { useWallet } from '@/components/context/WalletContext';

import { localDB } from './localDB';

export function useDB() {
  const { mode } = useWallet();
  return mode === 'simulation' ? localDB : db.entities;
}

// Mode-aware query key so React Query auto-invalidates on mode switch
export function useQK(key) {
  const { mode } = useWallet();
  return [key, mode];
}