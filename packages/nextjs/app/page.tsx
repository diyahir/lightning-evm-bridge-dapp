"use client";

// Import necessary hooks and components
import { useState } from "react";
import "../styles/bg.css";
import "../styles/glowButton.css";
import { useAccount } from "wagmi";
// Import your custom components and hooks
import { HistoryTable } from "~~/components/HistoryTable";
import SendModalPopup from "~~/components/SendModalPopup";
import { useLightningApp } from "~~/hooks/LightningProvider";
import { useAccountBalance } from "~~/hooks/scaffold-eth";

const Home = () => {
  const { address } = useAccount();
  const { balance } = useAccountBalance(address);
  const { isWebSocketConnected, price } = useLightningApp();
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);
  const onOpen = () => setIsOpen(true);
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
      <div className="bg-oval-gradient justify-center absolute bg-gradient-to-r from-yellow-400 to-violet-800 opacity-25">
        {/* Your content here */}
      </div>

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
          <div className="card-footer p-4 flex justify-between flex-wrap">
            <button
              className={`btn btn-neutral w-full min-w-[136px] disabled:opacity-50 glow glow-on-hover outline-none focus:outline-none ring-violet-800 ring-2 ring-offset-2`}
              disabled={!isWebSocketConnected}
              onClick={onOpen}
            >
              Send over Lightning
            </button>
          </div>

          <HistoryTable />
        </div>

        <SendModalPopup isOpen={isOpen} onClose={onClose} />
      </div>
    </>
  );
};

export default Home;
