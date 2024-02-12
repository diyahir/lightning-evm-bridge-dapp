"use client";

import { useState } from "react";
// import { QrScanner } from "@yudiel/react-qr-scanner";
import { PaymentRequestObject, decode } from "bolt11";
import type { NextPage } from "next";
import { useAccount, useWalletClient } from "wagmi";
import { useAccountBalance, useScaffoldContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address } = useAccount();
  const { balance } = useAccountBalance(address);

  // function handleScan(data: any) {
  //   console.log("Scanning", data);
  //   console.log("Scanning", data);
  //   const decoded = decode(data);
  //   console.log(decoded);
  // }
  // function handleError(err: any) {
  //   console.error(err);
  // }
  const { data: walletClient } = useWalletClient();

  const { data: yourContract } = useScaffoldContract({
    contractName: "HashedTimelock",
    walletClient,
  });

  function convertToHex(str: string) {
    let hex = "0x";
    for (let i = 0; i < str.length; i++) {
      hex += "" + str.charCodeAt(i).toString(16);
    }
    return hex;
  }

  const [invoice, setInvoice] = useState<string>("");
  const [decoded, setDecoded] = useState<PaymentRequestObject | null>(null);

  console.log(decoded);

  function handleInvoiceChange(invoice: string) {
    try {
      setInvoice(invoice);
      const tempdecoded = decode(invoice);
      setDecoded(tempdecoded);
      console.log(tempdecoded);
      console.log(convertToHex("secret"));
      if (!yourContract) return;
      if (!tempdecoded.satoshis) return;
      yourContract?.write.newContract(
        [
          "0x0f82D24134bDE2e536B801B26F120B8F60f54a9f",
          "0x68e62910041415a8cbb5fb9a61d389812707693a40027dd2220c49aad06d0cfe",
          BigInt(tempdecoded.satoshis),
        ],
        {
          value: BigInt(tempdecoded.satoshis),
        },
      );
    } catch (e) {
      console.error(e);
      setDecoded(null);
    }
  }

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
            <input
              type="text"
              className="form-control"
              placeholder="Invoice"
              value={invoice}
              onChange={e => handleInvoiceChange(e.target.value)}
            />
            <button className="btn btn-primary">Send</button>
            <button className="btn btn-secondary">Receive</button>
          </div>
        </div>

        {/* <QrScanner
          scanDelay={1}
          onError={handleError}
          onResult={result => handleScan(result)}
          onDecode={result => handleScan(result)}
        /> */}
      </div>
    </>
  );
};

export default Home;
