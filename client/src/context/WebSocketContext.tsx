import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

export interface WebSocketEventFrame {
  eventId: string;
  timestamp: string;
  type: string;
  channel: string;
  is_simulated: boolean;
  dataSource: string;
  data: any;
}

interface WebSocketContextType {
  connectionStatus: ConnectionStatus;
  lastEvent: WebSocketEventFrame | null;
  subscribeChannel: (channel: string) => void;
  unsubscribeChannel: (channel: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const MAX_DEDUPLICATION_ENTRIES = 100;

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, role } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [lastEvent, setLastEvent] = useState<WebSocketEventFrame | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Deduplication set tracking recent eventId strings
  const processedEventIdsRef = useRef<Set<string>>(new Set());

  const addDeduplicatedEvent = useCallback((eventId: string): boolean => {
    if (!eventId) return false;
    if (processedEventIdsRef.current.has(eventId)) {
      return true; // Already processed
    }
    processedEventIdsRef.current.add(eventId);
    if (processedEventIdsRef.current.size > MAX_DEDUPLICATION_ENTRIES) {
      const firstKey = processedEventIdsRef.current.values().next().value;
      if (firstKey) {
        processedEventIdsRef.current.delete(firstKey);
      }
    }
    return false;
  }, []);

  const connect = useCallback(() => {
    if (!token) {
      setConnectionStatus('DISCONNECTED');
      return;
    }

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setConnectionStatus(reconnectAttemptRef.current > 0 ? 'RECONNECTING' : 'CONNECTING');

    const wsUrl = `ws://localhost:8000/api/v1/ws/live?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('CONNECTED');
      reconnectAttemptRef.current = 0;

      // Subscribe to allowed channels based on user role
      const initialChannels =
        role === 'CITIZEN'
          ? ['traffic', 'alerts']
          : role === 'AMBULANCE_RESPONDER' || role === 'HOSPITAL'
          ? ['emergency']
          : ['traffic', 'alerts', 'emergency'];

      ws.send(
        JSON.stringify({
          type: 'SUBSCRIBE',
          channels: initialChannels,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        // Handle PING heartbeat frame
        if (payload.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
          return;
        }

        // Handle event frame
        if (payload.eventId) {
          const isDuplicate = addDeduplicatedEvent(payload.eventId);
          if (!isDuplicate) {
            setLastEvent(payload as WebSocketEventFrame);
          }
        }
      } catch (err) {
        console.warn('Failed to parse WebSocket message frame:', err);
      }
    };

    ws.onerror = () => {
      // Errors trigger onclose for reconnection backoff
    };

    ws.onclose = (evt) => {
      setConnectionStatus('DISCONNECTED');
      socketRef.current = null;

      // Attempt exponential backoff reconnection if token remains valid (and not intentional 1008 close)
      if (token && evt.code !== 1008) {
        const nextAttempt = reconnectAttemptRef.current + 1;
        reconnectAttemptRef.current = nextAttempt;

        // Backoff sequence: 1s, 2s, 5s, max 10s
        const delayMs = nextAttempt === 1 ? 1000 : nextAttempt === 2 ? 2000 : nextAttempt === 3 ? 5000 : 10000;

        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, delayMs);
      }
    };
  }, [token, role, addDeduplicatedEvent]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const subscribeChannel = useCallback((channel: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'SUBSCRIBE',
          channels: [channel],
        })
      );
    }
  }, []);

  const unsubscribeChannel = useCallback((channel: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'UNSUBSCRIBE',
          channels: [channel],
        })
      );
    }
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        connectionStatus,
        lastEvent,
        subscribeChannel,
        unsubscribeChannel,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
