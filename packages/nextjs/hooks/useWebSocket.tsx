// src/hooks/useWebSocket.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { InvoiceRequest, InvoiceResponse } from "~~/types/utils";

export const useWebSocket = (url: string) => {
  // return { sendMessage: useCallback(() => {}, []), data: null, error: null, isOpen: false };
  const socket = useRef<WebSocket | null>(null);
  const [data, setData] = useState<InvoiceResponse | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    socket.current = new WebSocket(url);

    socket.current.onopen = () => setIsOpen(true);
    socket.current.onclose = () => setIsOpen(false);
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
      if (!isOpen) {
        console.error("WebSocket is not open");
        return;
      }
      socket.current?.send(JSON.stringify(message));
    },
    [isOpen],
  );

  return { sendMessage, data, error, isOpen };
};
