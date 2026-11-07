import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from '../services/api';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = useMemo(() => {
    return io(API_BASE || window.location.origin, {
      autoConnect: false,
      // Try a WebSocket first (one request instead of a polling handshake), fall back to polling.
      transports: ['websocket', 'polling'],
    });
  }, []);

  const hasConnected = useRef(false);
  const connectCount = useRef(0);

  useEffect(() => {
    if (!hasConnected.current) {
      socket.connect();
      hasConnected.current = true;
    }

    const onReconnect = () => {
      // Re-authenticate on reconnection
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload?.id) {
            socket.emit('authenticate', token);
          }
        } catch (e) {
          // Invalid token, skip
        }
      }
      // Only a *re*-connect means we may have missed events. The first connect happens
      // while the initial data load is already in flight, so re-fetching then is wasted work.
      connectCount.current += 1;
      if (connectCount.current > 1) {
        window.dispatchEvent(new Event('socket_reconnect'));
      }
    };

    socket.on('connect', onReconnect);

    return () => {
      socket.off('connect', onReconnect);
    };
  }, [socket]);

  // Authenticate socket when user logs in
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      if (token && socket.connected) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload?.id) {
            socket.emit('authenticate', token);
          }
        } catch (e) {
          // Invalid token
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
