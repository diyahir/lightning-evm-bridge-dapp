import React, { createContext, useContext, useEffect, useState } from "react";
import { useScaffoldEventSubscriber } from "./scaffold-eth";
import { useWebSocket } from "./useWebSocket";
import { useToast } from "@chakra-ui/react";
// import { useWalletClient } from "wagmi";
import { InvoiceRequest, InvoiceResponse } from "~~/types/utils";

// Define the types for your historical transactions and context
export type HistoricalTransaction = {
  status: "pending" | "failed" | "completed" | "refunded";
  date: string;
  amount: number;
  contractId: string;
  txHash: string;
  hashLockTimestamp: number;
  lnInvoice: string;
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
  const [transactions, setTransactionsState] = useState<HistoricalTransaction[]>([]);
  const transactionRef = React.useRef<HistoricalTransaction[]>([]);
  const toast = useToast();
  const setTransactions = (transactions: HistoricalTransaction[]) => {
    transactionRef.current = transactions;
    setTransactionsState(transactions);
  };

  const { sendMessage, isWebSocketConnected, data } = useWebSocket("ws://localhost:3003");
  // const { data: walletClient } = useWalletClient();
  // const { data: yourContract } = useScaffoldContract({
  //   contractName: "HashedTimelock",
  //   walletClient,
  // });

  useScaffoldEventSubscriber({
    contractName: "HashedTimelock",
    eventName: "LogHTLCNew",
    listener: event => {
      const tmpContractId = event[0].args.contractId;
      const txHash = event[0].transactionHash;
      if (!tmpContractId) return;
      // check if the transaction has the same has as one of the transactions in the list
      const index = transactionRef.current.findIndex(t => t.txHash === txHash);
      if (index === -1) return;
      sendMessage({ contractId: tmpContractId, lnInvoice: transactionRef.current[index]?.lnInvoice });
      addTransaction({
        status: "pending",
        date: new Date().toLocaleString(),
        amount: transactionRef.current[index].amount,
        txHash: txHash,
        contractId: tmpContractId.toString(),
        hashLockTimestamp: transactionRef.current[index].hashLockTimestamp,
        lnInvoice: transactionRef.current[index].lnInvoice,
      });
    },
  });

  useEffect(() => {
    if (data === null) return;
    const lastTransaction = transactionRef.current[transactionRef.current.length - 1];
    if (data?.status === "success") {
      addTransaction({
        status: "completed",
        date: lastTransaction.date,
        amount: lastTransaction.amount,
        txHash: lastTransaction.txHash,
        contractId: lastTransaction.contractId,
        hashLockTimestamp: lastTransaction.hashLockTimestamp,
        lnInvoice: lastTransaction.lnInvoice,
      });
      toast({
        title: "Payment Success",
        description: "Payment has been successfully completed",
        status: "success",
        duration: 9000,
        isClosable: true,
        position: "top",
      });
    } else {
      toast({
        title: "Payment Failed",
        description: data?.message || "Payment has failed",
        status: "error",
        duration: 9000,
        isClosable: true,
        position: "top",
      });
      addTransaction({
        status: "failed",
        date: lastTransaction.date,
        amount: lastTransaction.amount,
        txHash: lastTransaction.txHash,
        contractId: lastTransaction.contractId,
        hashLockTimestamp: lastTransaction.hashLockTimestamp,
        lnInvoice: lastTransaction.lnInvoice,
      });
    }
  }, [data]);

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

    setTransactions([transaction, ...transactions]);
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
