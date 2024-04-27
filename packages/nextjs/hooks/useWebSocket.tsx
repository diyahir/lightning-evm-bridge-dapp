import { useCallback, useEffect, useRef, useState } from "react";
import { ClientRequest, InvoiceResponse, ServerStatus } from "shared";
import { ConnectionResponse } from "~~/types/utils";

export const useWebSocket = (url: string) => {
  const socket = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ServerStatus>(ServerStatus.INACTIVE);
  const [data, setData] = useState<InvoiceResponse | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState<boolean>(false);
  const reconnectInterval = useRef<NodeJS.Timeout | null>(null);

  const checkAndReconnect = () => {
    if (!isWebSocketConnected) {
      console.log("Reconnecting WebSocket...");
      reconnect();
    }
  };

  const reconnect = () => {
    if (socket.current) {
      socket.current.close();
    }
    initializeWebSocket();
  };

  const initializeWebSocket = () => {
    socket.current = new WebSocket(url);

    socket.current.onopen = () => {
      setIsWebSocketConnected(true);
      if (reconnectInterval.current) {
        clearInterval(reconnectInterval.current);
      }
    };
    socket.current.onclose = () => {
      setIsWebSocketConnected(false);
      if (!reconnectInterval.current) {
        reconnectInterval.current = setInterval(checkAndReconnect, 6000); // 20 seconds
      }
    };
    socket.current.onerror = event => setError(event);
    socket.current.onmessage = event => {
      try {
        const responseData: ConnectionResponse | InvoiceResponse = JSON.parse(event.data);
        if (responseData && "serverStatus" in responseData) {
          setStatus(responseData.serverStatus as ServerStatus);
          return;
        }
        if (responseData && "status" in responseData) {
          setData(responseData);
          return;
        }
      } catch (err) {
        console.error("Failed to parse message", err);
      }
    };
  };

  useEffect(() => {
    initializeWebSocket();
    return () => {
      if (socket.current) {
        socket.current.close();
      }
      if (reconnectInterval.current) {
        clearInterval(reconnectInterval.current);
      }
    };
  }, [url]);

  const sendMessage = useCallback(
    (message: ClientRequest) => {
      if (!isWebSocketConnected) {
        console.error("WebSocket is not open");
        return;
      }
      socket.current?.send(JSON.stringify(message));
    },
    [isWebSocketConnected],
  );

  return { sendMessage, data, error, isWebSocketConnected, reconnect, status };
};
