"use client";

import { useState } from "react";
// import { QrScanner } from "@yudiel/react-qr-scanner";
import { PaymentRequestObject, decode } from "bolt11";
import type { NextPage } from "next";
import { useAccount, useWalletClient } from "wagmi";
import { PaymentInvoice } from "~~/components/PaymentInvoice";
import { useAccountBalance, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { LnPaymentInvoice } from "~~/types/utils";

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

  const [invoice, setInvoice] = useState<string>("");
  const [decoded, setDecoded] = useState<PaymentRequestObject | null>(null);
  const [lnInvoice, setLnInvoice] = useState<LnPaymentInvoice | null>(null);

  console.log(decoded);

  function getPaymentHash(requestObject: PaymentRequestObject): `0x${string}` | undefined {
    // go through the tags and find the 'payment_hash' tagName and return the 'data'
    const paymentHash = requestObject.tags.find(tag => tag.tagName === "payment_hash");
    if (!paymentHash) {
      return undefined;
    }
    return ("0x" + paymentHash.data.toString()) as `0x${string}`;
  }

  function submitPayment() {
    if (!yourContract) return;
    if (!lnInvoice) return;
    yourContract.write.newContract(
      ["0x0f82D24134bDE2e536B801B26F120B8F60f54a9f", lnInvoice.paymentHash, BigInt(lnInvoice.timeExpireDate)],
      {
        value: BigInt(lnInvoice.satoshis),
      },
    );
  }

  function handleInvoiceChange(invoice: string) {
    try {
      setInvoice(invoice);
      const tempdecoded = decode(invoice);
      console.log(tempdecoded);
      const paymentHash = getPaymentHash(tempdecoded);
      setDecoded(tempdecoded);

      if (!tempdecoded.satoshis) return;
      if (!paymentHash) return;
      if (!tempdecoded.timeExpireDate) return;

      setLnInvoice({
        satoshis: tempdecoded.satoshis,
        timeExpireDate: tempdecoded.timeExpireDate,
        paymentHash,
        lnInvoice: invoice,
      });
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
            <span className="block text-3xl">
              <span className="font-bold">
                {balance ? `${(balance * 100_000_000).toLocaleString()}` : "Loading Balance..."}
              </span>{" "}
              sats
            </span>
          </h1>
        </div>

        {/* Wallet Section */}
        {!lnInvoice && (
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
        )}

        {lnInvoice && (
          <PaymentInvoice
            invoice={lnInvoice}
            submitPayment={submitPayment}
            cancelPayment={() => {
              setLnInvoice(null);
              setInvoice("");
            }}
          ></PaymentInvoice>
        )}
        {/* 
        <QrScanner
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
