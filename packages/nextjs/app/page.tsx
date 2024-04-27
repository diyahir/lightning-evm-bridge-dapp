"use client";

// Import necessary hooks and components
import { useState } from "react";
import "../styles/bg.css";
import "../styles/glowButton.css";
import { useAccount } from "wagmi";
import { HistoryTable } from "~~/components/HistoryTable";
import SendModalPopup from "~~/components/SendModalPopup";
import { useLightningApp } from "~~/hooks/LightningProvider";
import { useAccountBalance } from "~~/hooks/scaffold-eth";

const Home = () => {
  const { address } = useAccount();
  const { balance } = useAccountBalance(address);
  const { isWebSocketConnected, price } = useLightningApp();
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const onCloseSendModal = () => setIsSendModalOpen(false);
  const onOpenSendModal = () => setIsSendModalOpen(true);
  const [balanceVisibility, setBalanceVisibility] = useState(0);

  function getBalanceWithVisibility() {
    if (balance === null) return "Loading Balance...";
    if (balanceVisibility === 0) {
      return `${Math.floor(balance * 100_000_000).toLocaleString()} sats`;
    }
    if (balanceVisibility === 1) {
      return `$${(balance * price).toFixed(2)} USD`;
    }
    if (balanceVisibility === 2) {
      return "****** sats";
    }
  }

  return (
    <>
      <div className="bg-oval-gradient justify-center absolute bg-gradient-to-r from-yellow-400 to-violet-800 opacity-25" />
      <div className="font-plex container mx-auto flex h-[95%] items-center justify-center">
        <div className="card w-[500px] ">
          <div className="card-header text-white p-4">
            <h1
              className="cursor-pointer text-center text-3xl font-mono mt-10"
              onClick={() => setBalanceVisibility((balanceVisibility + 1) % 3)}
            >
              {getBalanceWithVisibility()}
            </h1>
          </div>
          <div className="card-footer p-4 flex justify-between items-center font-mono">
            <button
              className="btn btn-neutral w-5/12 disabled:opacity-50 glow glow-on-hover outline-none focus:outline-none ring-violet-800 ring-2 ring-offset-2 mr-4"
              disabled={!isWebSocketConnected || balance === null || address === undefined}
              onClick={onOpenSendModal}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 4.5-15 15m0 0h11.25m-11.25 0V8.25" />
              </svg>
              Receive{" "}
            </button>
            <button
              className="btn btn-neutral w-5/12 disabled:opacity-50 glow glow-on-hover outline-none focus:outline-none ring-violet-800 ring-2 ring-offset-2"
              disabled={!isWebSocketConnected || balance === null || address === undefined}
              onClick={onOpenSendModal}
            >
              Send
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
                  d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </button>
          </div>

          <HistoryTable />
        </div>

        <SendModalPopup isOpen={isSendModalOpen} onClose={onCloseSendModal} />
      </div>
    </>
  );
};

export default Home;
