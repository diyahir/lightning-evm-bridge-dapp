import React, { createContext, useContext, useState } from "react";
import { useWebSocket } from "./useWebSocket";
import { InvoiceRequest, InvoiceResponse } from "~~/types/utils";

// Define the types for your historical transactions and context
export type HistoricalTransaction = {
  status: "pending" | "failed" | "completed" | "refunded";
  date: string;
  amount: number;
  contractId: string;
  txHash: string;
  hashLockTimestamp: number;
};

export type LightningAppContextType = {
  transactions: HistoricalTransaction[];
  addTransaction: (transaction: HistoricalTransaction) => void;
  sendMessage: (message: InvoiceRequest) => void;
  isWebSocketConnected: boolean;
  data: InvoiceResponse | null;
};

// Create the context
const HistoricalTransactionsContext = createContext<LightningAppContextType | undefined>(undefined);

// Provider component
export const LightningProvider = ({ children }: { children: React.ReactNode }) => {
  const [transactions, setTransactions] = useState<HistoricalTransaction[]>([]);
  const { sendMessage, isWebSocketConnected, data } = useWebSocket("ws://localhost:3003");

  const addTransaction = (transaction: HistoricalTransaction) => {
    // check that amounts is non-zero
    if (transaction.amount === 0) return;
    // check if the transaction is already in the list then replace
    const index = transactions.findIndex(t => t.txHash === transaction.txHash);
    if (index !== -1) {
      const newTransactions = [...transactions];
      newTransactions[index] = transaction;
      setTransactions(newTransactions);
      return;
    }

    setTransactions(prevTransactions => [transaction, ...prevTransactions]);
  };

  return (
    <HistoricalTransactionsContext.Provider
      value={{ transactions, data, addTransaction, sendMessage, isWebSocketConnected }}
    >
      {children}
    </HistoricalTransactionsContext.Provider>
  );
};

// Custom hook for using the context
export const useLightningApp = () => {
  const context = useContext(HistoricalTransactionsContext);
  if (context === undefined) {
    throw new Error("useLightningApp must be used within a HistoricalTransactionsProvider");
  }
  return context;
};
