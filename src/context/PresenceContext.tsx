import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

export type PresenceChoice = 'online' | 'dnd' | 'invisible';
export type PublicPresenceStatus = 'online' | 'dnd' | 'offline';

export interface InGameInfo {
  roomCode: string;
  mode: string;
}

export interface UserPresence {
  status: PublicPresenceStatus;
  inGame: InGameInfo | null;
}

interface PresenceContextValue {
  presenceMap: Record<string, UserPresence>;
  myStatus: PresenceChoice;
  setMyStatus: (status: PresenceChoice) => void;
  getUserPresence: (username?: string | null) => UserPresence;
}

const OFFLINE_PRESENCE: UserPresence = { status: 'offline', inGame: null };

const PresenceContext = createContext<PresenceContextValue | null>(null);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = useSocket();
  const { user } = useAuth();
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>({});
  const [myStatus, setMyStatusState] = useState<PresenceChoice>('online');

  useEffect(() => {
    const initial = (user as any)?.presence_status;
    if (initial === 'online' || initial === 'dnd' || initial === 'invisible') {
      setMyStatusState(initial);
    }
  }, [(user as any)?.presence_status]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleSync = (map: Record<string, UserPresence>) => {
      if (map && typeof map === 'object') {
        setPresenceMap(map);
      }
    };

    const handleMyStatus = (payload?: { status?: PresenceChoice }) => {
      if (payload?.status && ['online', 'dnd', 'invisible'].includes(payload.status)) {
        setMyStatusState(payload.status);
      }
    };

    const requestSync = () => {
      socket.emit('get_presence');
    };

    socket.on('presence_sync', handleSync);
    socket.on('my_presence_status', handleMyStatus);
    socket.on('connect', requestSync);

    if (socket.connected) {
      requestSync();
    }

    return () => {
      socket.off('presence_sync', handleSync);
      socket.off('my_presence_status', handleMyStatus);
      socket.off('connect', requestSync);
    };
  }, [socket]);

  const setMyStatus = useCallback((status: PresenceChoice) => {
    setMyStatusState(status);
    if (socket) {
      socket.emit('set_presence_status', status);
    }
  }, [socket]);

  const getUserPresence = useCallback((username?: string | null): UserPresence => {
    if (!username) return OFFLINE_PRESENCE;
    const key = String(username).trim().toLowerCase();
    return presenceMap[key] || OFFLINE_PRESENCE;
  }, [presenceMap]);

  return (
    <PresenceContext.Provider value={{ presenceMap, myStatus, setMyStatus, getUserPresence }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = (): PresenceContextValue => {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error('usePresence must be used within a PresenceProvider');
  return ctx;
};

export const usePresenceOptional = (): PresenceContextValue | null => {
  return useContext(PresenceContext);
};
