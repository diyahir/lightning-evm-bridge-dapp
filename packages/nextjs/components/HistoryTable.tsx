import React, { Fragment, useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import { useWalletClient } from "wagmi";
import { HistoricalTransaction, useLightningApp } from "~~/hooks/LightningProvider";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

export const HistoryTable = () => {
  const { transactions, addTransaction, toastSuccess, toastError } = useLightningApp();
  const [expandedRow, setExpandedRow] = useState<number | null>(null); // State to manage expanded row index
  const { data: walletClient } = useWalletClient();
  const { data: htlcContract } = useScaffoldContract({
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
    toastSuccess(message);
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
    if (!htlcContract) return;
    htlcContract.write
      .refund([transaction.contractId as `0x${string}`], {})
      .then(tx => {
        console.log(tx);
        toastSuccess("Refund Successful");
        addTransaction({
          status: "refunded",
          date: new Date().toLocaleString(),
          amount: transaction.amount,
          txHash: tx,
          contractId: transaction.contractId,
          hashLockTimestamp: transaction.hashLockTimestamp,
          lnInvoice: transaction.lnInvoice,
          type: "send",
        });
      })
      .catch(e => {
        console.error(e);
        toastError("Refund Failed");
      });
  }

  return (
    <div className="card bg-brand-bg text-white font-mono">
      <div className="card-body p-4">
        <h2 className="text-center font-mono text-md">History</h2>
        <table className="table table-auto w-full text-sm ">
          {transactions.length > 0 && (
            <>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              {transactions.map((transaction, index) => (
                <tbody key={index}>
                  {" "}
                  {/* Move React.Fragment key to tbody */}
                  <tr
                    onClick={() => toggleRow(index)}
                    className={`cursor-pointer ${
                      transaction.status === "failed" ? "bg-red-400" : ""
                    } hover:bg-white hover:bg-opacity-10`}
                  >
                    <td>{transaction.status}</td>
                    <td className="tooltip" data-tip={getTooltipText(transaction)}>
                      {transaction.date}
                    </td>
                    <td className={`text-right ${transaction.type === "send" ? "text-red-500" : "text-green-500"}`}>
                      {transaction.type === "send" ? "-" : "+"}
                      {transaction.amount} sats
                    </td>
                  </tr>
                  {expandedRow === index && (
                    <tr>
                      <td colSpan={3}>
                        <div className="p-2">
                          TimeLock expiry: {new Date(transaction.hashLockTimestamp * 1000).toLocaleString()}
                          <br />
                          <br />
                          <button
                            className="btn btn-neutral text-white text-xs p-2"
                            onClick={() => toastAndCopy(transaction.txHash, "Transaction hash copied to clipboard")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"
                              />
                            </svg>
                          </button>
                          &nbsp; txHash: {transaction.txHash.substring(0, 20)}...
                          <br />
                          <br />
                          <button
                            className="btn btn-neutral text-white text-xs p-2"
                            onClick={() => toastAndCopy(transaction.contractId, "Contract ID copied to clipboard")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"
                              />
                            </svg>
                          </button>
                          &nbsp; contractId: {transaction.contractId.substring(0, 16)}...
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}
            </>
          )}
          {transactions.length === 0 && (
            <tbody>
              <tr>
                <td className="text-center py-4" colSpan={3}>
                  No history...go send your first lightning payment!
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};
