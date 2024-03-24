"use client";

import { useEffect, useRef, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { PaymentRequestObject, decode } from "bolt11";
import { useWalletClient } from "wagmi";
import { PaymentInvoice } from "~~/components/PaymentInvoice";
import { useLightningApp } from "~~/hooks/LightningProvider";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { LnPaymentInvoice } from "~~/types/utils";
import { GWEIPERSAT } from "~~/utils/scaffold-eth/common";

type SendModalProps = {
  isOpen: boolean;
  onClose: () => void;
};
function SendModal({ isOpen, onClose }: SendModalProps) {
  const { addTransaction, transactions, toastError } = useLightningApp();
  const [invoice, setInvoice] = useState<string>("");
  const lnInvoiceRef = useRef<LnPaymentInvoice | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);

  function cleanAndClose() {
    lnInvoiceRef.current = null;
    setInvoice("");
    setContractId(null);
    setActiveStep(1);
    onClose();
  }

  useEffect(() => {
    // check if the latest transaction has a contractId then update the active step to 3
    if (transactions.length === 0) return;
    const lastTransaction = transactions[0];
    if (lastTransaction.lnInvoice !== lnInvoiceRef.current?.lnInvoice) return;
    if (lastTransaction.status === "pending" && lastTransaction.contractId) {
      setActiveStep(3);
    }
    if (lastTransaction.status === "completed") {
      setActiveStep(4);
      cleanAndClose();
    }
    if (lastTransaction.status === "failed") {
      setActiveStep(4);
      cleanAndClose();
    }
  }, [transactions]);

  const { data: walletClient } = useWalletClient();
  const { data: yourContract } = useScaffoldContract({
    contractName: "HashedTimelock",
    walletClient,
  });

  const [activeStep, setActiveStep] = useState<number>(1);

  function getMinTimelock(lnInvoiceTimelock: number) {
    const now = Math.floor(Date.now() / 1000);
    return Math.min(now + 600, lnInvoiceTimelock);
  }

  function handleScan(data: any) {
    console.log("Scanning", data);
    handleInvoiceChange(data);
  }
  function handleError(err: any) {
    console.error(err);
  }

  function getPaymentHash(requestObject: PaymentRequestObject): `0x${string}` | undefined {
    // go through the tags and find the 'payment_hash' tagName and return the 'data'
    const paymentHash = requestObject.tags.find((tag: any) => tag.tagName === "payment_hash");
    if (!paymentHash) {
      return undefined;
    }
    return ("0x" + paymentHash.data.toString()) as `0x${string}`;
  }

  function submitPayment() {
    if (!yourContract) return;
    if (!lnInvoiceRef.current) return;
    yourContract.write
      .newContract(
        [
          process.env.LSP_ADDRESS ?? "0xf89335a26933d8Dd6193fD91cAB4e1466e5198Bf",
          lnInvoiceRef.current.paymentHash,
          BigInt(getMinTimelock(lnInvoiceRef.current.timeExpireDate)),
        ],
        {
          value: BigInt(lnInvoiceRef.current.satoshis * GWEIPERSAT),
        },
      )
      .then(tx => {
        console.log("txHash", tx);
        addTransaction({
          status: "pending",
          date: new Date().toLocaleString(),
          amount: lnInvoiceRef.current ? lnInvoiceRef.current.satoshis : 0,
          txHash: tx,
          contractId: contractId || "",
          hashLockTimestamp: getMinTimelock(lnInvoiceRef.current ? lnInvoiceRef.current.timeExpireDate : 0),
          lnInvoice: lnInvoiceRef.current ? lnInvoiceRef.current.lnInvoice : "",
        });
        setActiveStep(2);
      })
      .catch(e => {
        console.error(e.message);
        toastError("User rejected transaction");
        cleanAndClose();
      });
  }

  function handleInvoiceChange(invoice: string) {
    try {
      setInvoice(invoice);
      const tempdecoded = decode(invoice);
      const paymentHash = getPaymentHash(tempdecoded);

      if (!tempdecoded.satoshis) return;
      if (!paymentHash) return;
      if (!tempdecoded.timeExpireDate) return;

      console;

      lnInvoiceRef.current = {
        satoshis: tempdecoded.satoshis,
        timeExpireDate: tempdecoded.timeExpireDate,
        paymentHash,
        lnInvoice: invoice,
      };
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-40 flex justify-center items-center font-mono">
          <div className="card lg:w-1/3 md:w-1/2 w-full bg-base-200 rounded-lg md:h-auto">
            <div className="flex w-full items-center justify-center relative text-white bg-brand-bg pt-4 rounded-t-lg">
              <span className="">{lnInvoiceRef.current == null ? "Scan QR Code" : "Review"}</span>
              <button
                onClick={cleanAndClose}
                className="btn-neutral absolute right-5 top-1/2 transform -translate-y-2 btn btn-circle btn-sm"
              >
                X
              </button>
            </div>
            <div className="flex flex-col items-center justify-center p-6">
              {!lnInvoiceRef.current && (
                <div className="flex w-full flex-col items-center gap-5">
                  {/* QR Scanner */}
                  <Scanner
                    onError={handleError}
                    onResult={result => handleScan(result)}
                    // onDecode={result => handleScan(result)}
                  />
                  <div className="join w-full">
                    <button
                      className="btn join-item cursor-pointer bg-gray-600 p-2"
                      onClick={() => {
                        navigator.clipboard.readText().then(text => {
                          handleInvoiceChange(text);
                        });
                      }}
                    >
                      Paste
                    </button>
                    <input
                      type="text"
                      placeholder="ln1232...."
                      className="input input-bordered join-item w-full"
                      value={invoice}
                      onChange={e => handleInvoiceChange(e.target.value)}
                    />
                  </div>
                </div>
              )}
              {lnInvoiceRef.current && (
                <PaymentInvoice
                  invoice={lnInvoiceRef.current}
                  submitPayment={submitPayment}
                  contractId={contractId}
                  step={activeStep}
                  expiryDate={getMinTimelock(lnInvoiceRef.current.timeExpireDate).toString()}
                  cancelPayment={() => {
                    lnInvoiceRef.current = null;
                    setInvoice("");
                    setContractId(null);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SendModal;
