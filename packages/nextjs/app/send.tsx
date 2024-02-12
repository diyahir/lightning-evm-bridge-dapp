"use client";

// import { useState } from "react";
// import { decode } from "bolt11";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useAccountBalance } from "~~/hooks/scaffold-eth";

const Send: NextPage = () => {
  const { address } = useAccount();
  const { balance } = useAccountBalance(address);

  // const [invoice, setInvoice] = useState<string>("");
  // const decoded = decode(invoice);
  // console.log(decoded);
  return (
    <>
      <div className="flex justify-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">
              {balance ? `${(balance * 100_000_000).toLocaleString()} SATS` : "Loading Balance..."}
            </span>
          </h1>
        </div>

        {/* Wallet Section */}
        <div className="wallet w-full py-8">
          <div className="flex justify-center gap-4 mt-6">
            <button className="btn btn-primary">Send</button>
            <button className="btn btn-secondary">Receive</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Send;
