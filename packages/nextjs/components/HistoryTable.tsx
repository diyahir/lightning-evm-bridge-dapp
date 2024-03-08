import React, { Fragment, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { useWalletClient } from "wagmi";
import { HistoricalTransaction, useLightningApp } from "~~/hooks/LightningProvider";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

export const HistoryTable = () => {
  const { transactions, addTransaction } = useLightningApp();
  const toast = useToast();
  const [expandedRow, setExpandedRow] = useState<number | null>(null); // State to manage expanded row index
  const { data: walletClient } = useWalletClient();
  const { data: yourContract } = useScaffoldContract({
    contractName: "HashedTimelock",
    walletClient,
  });
  const toggleRow = (index: number | null) => {
    setExpandedRow(expandedRow === index ? null : index); // Toggle between null and the current index
    if (index === null) return;

    if (transactions[index].status === "failed") {
      refund(transactions[index]);
    }
  };

  const toastAndCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast({
      position: "top",
      title: message,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  function getTooltipText(transaction: HistoricalTransaction) {
    switch (transaction.status) {
      case "pending":
        return "Waiting for the transaction to be included in a block";
      case "completed":
        return "Expand for more details";
      case "failed":
        return `Transaction failed: Redeemable at ${new Date(transaction.hashLockTimestamp * 1000).toLocaleString()}`;
      case "refunded":
        return "Transaction refunded";
      default:
        return "";
    }
  }

  function refund(transaction: HistoricalTransaction) {
    if (transaction.contractId === "") return;
    if (transaction.hashLockTimestamp > Date.now() / 1000) {
      return;
    }
    if (!yourContract) return;
    yourContract.write
      .refund([transaction.contractId as `0x${string}`], {})
      .then(tx => {
        console.log(tx);
        toast({
          position: "top",
          title: "Refund Success",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        addTransaction({
          status: "refunded",
          date: new Date().toLocaleString(),
          amount: transaction.amount,
          txHash: tx,
          contractId: transaction.contractId,
          hashLockTimestamp: transaction.hashLockTimestamp,
          lnInvoice: transaction.lnInvoice,
        });
      })
      .catch(e => {
        console.error(e);
        toast({
          position: "top",
          title: "Refund Failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      });
  }

  return (
    <div className="card bg-brand-bg text-white">
      <div className="card-body p-4">
        <h2 className="text-center font-mono text-md mb-5">History</h2>
        <table className="table-auto w-full text-sm">
          {transactions.length > 0 && (
            <>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <React.Fragment key={index}>
                    <tr
                      onClick={() => toggleRow(index)}
                      className={`cursor-pointer ${
                        transaction.status === "failed" ? "bg-red-400" : ""
                      } hover:bg-white hover:bg-opacity-10`}
                    >
                      <td>{transaction.status}</td>
                      <td>{transaction.date}</td>
                      <td className="text-right">{transaction.amount} sats</td>
                    </tr>
                    {expandedRow === index && (
                      <tr>
                        <td colSpan={3}>
                          <div className="p-4">
                            TimeLock expiry: {new Date(transaction.hashLockTimestamp * 1000).toLocaleString()}
                            <br />
                            <br />
                            <button
                              className="btn btn-ghost text-white text-xs p-2"
                              onClick={() => toastAndCopy(transaction.txHash, "Transaction hash copied to clipboard")}
                            >
                              {/* Assuming CopyIcon is a SVG or similar; ensure you have a Tailwind way to display it */}
                              Copy txHash
                            </button>
                            &nbsp; txHash: {transaction.txHash.substring(0, 20)}...
                            <br />
                            <br />
                            <button
                              className="btn text-white text-xs p-2"
                              onClick={() => toastAndCopy(transaction.contractId, "Contract ID copied to clipboard")}
                            >
                              {/* Assuming CopyIcon is a SVG or similar; ensure you have a Tailwind way to display it */}
                              Copy contractId
                            </button>
                            &nbsp; contractId: {transaction.contractId.substring(0, 16)}...
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </>
          )}
          {transactions.length === 0 && (
            <tr>
              <td className="border border-gray-400 border-dashed text-center py-4">
                Send your first lightning transaction!
              </td>
            </tr>
          )}
        </table>
      </div>
    </div>
  );
};
