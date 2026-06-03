import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from '../services/api';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = useMemo(() => {
    return io(API_BASE || window.location.origin, {
      autoConnect: false,
    });
  }, []);

  useEffect(() => {
    socket.connect();
    return () => {
      if (socket) socket.disconnect();
    };
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
