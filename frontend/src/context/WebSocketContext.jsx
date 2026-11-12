import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ projectId, children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Set());

  const addListener = useCallback((cb) => {
    listenersRef.current.add(cb);
    return () => listenersRef.current.delete(cb);
  }, []);

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    let reconnectTimeout = null;

    const connect = () => {
      // Connect to websocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.port === '5173' ? 'localhost:8000' : window.location.host;
      const wsUrl = `${protocol}//${host}/api/v1/ws/${projectId}`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (isMounted) {
            setIsConnected(true);
            console.log(`[WS] Connected to project ${projectId}`);
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (isMounted) {
              setLastMessage(data);
              listenersRef.current.forEach(listener => listener(data));
            }
          } catch (e) {
            console.warn('[WS] Non-JSON message received:', event.data);
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            setIsConnected(false);
            // Reconnect after 3s
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };

        ws.onerror = (err) => {
          console.warn('[WS] Error:', err);
          ws.close();
        };
      } catch (e) {
        console.error('[WS] Connection error:', e);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [projectId]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, addListener }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
