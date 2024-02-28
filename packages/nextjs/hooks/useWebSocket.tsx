// src/hooks/useWebSocket.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { InvoiceRequest, InvoiceResponse } from "~~/types/utils";

export const useWebSocket = (url: string) => {
  // return { sendMessage: useCallback(() => {}, []), data: null, error: null, isOpen: false };
  const socket = useRef<WebSocket | null>(null);
  const [data, setData] = useState<InvoiceResponse | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState<boolean>(false);
  const reconnect = () => {
    if (socket.current) {
      socket.current.close();
    }
    socket.current = new WebSocket(url);
    setIsWebSocketConnected(true);
  };

  useEffect(() => {
    socket.current = new WebSocket(url);

    socket.current.onopen = () => setIsWebSocketConnected(true);
    socket.current.onclose = () => setIsWebSocketConnected(false);
    socket.current.onerror = event => setError(event);
    socket.current.onmessage = event => {
      try {
        console.log("Received message:", event.data);
        const responseData: InvoiceResponse = JSON.parse(event.data);
        setData(responseData);
      } catch (err) {
        console.error("Failed to parse message", err);
      }
    };

    return () => {
      socket.current?.close();
    };
  }, [url]);

  const sendMessage = useCallback(
    (message: InvoiceRequest) => {
      if (!isWebSocketConnected) {
        console.error("WebSocket is not open");
        return;
      }
      socket.current?.send(JSON.stringify(message));
    },
    [isWebSocketConnected],
  );

  return { sendMessage, data, error, isWebSocketConnected, reconnect };
};
