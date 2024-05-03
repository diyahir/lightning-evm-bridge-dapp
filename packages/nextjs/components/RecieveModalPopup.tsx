"use client";

import { useEffect, useRef, useState } from "react";
import { IntegerInput } from "./scaffold-eth";
import { randomBytes } from "crypto";
import { sha256 } from "js-sha256";
// import { PaymentRequestObject, decode } from "bolt11";
import QRCode from "qrcode.react";
import { InitiationRequest, KIND } from "shared";
import { useWalletClient } from "wagmi";
// import { useWalletClient } from "wagmi";
import { useLightningApp } from "~~/hooks/LightningProvider";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
// import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { LnPaymentInvoice } from "~~/types/utils";

type RecieveModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const steps = [
  {
    title: "Specify Amount (sats)",
    description: "The service fee covers the gas required for the LSP to initialize the trust-less smart contract.",
  },
  { title: "Pay initiation fee", description: "On-chain invoice locked in smart contract" },
  {
    title: "Pay Lightning Invoice",
    description: "The invoice id is sent and verified by the lightning provider",
  },
  { title: "Recieved", description: "The lightning provider pays lightning invoice. The reciever must be online." },
];

function RecieveModal({ isOpen, onClose }: RecieveModalProps) {
  const { toastSuccess, sendMessage, lnInitationResponse, hashLock, setHashLock, recieveContractId } =
    useLightningApp();
  const [invoice, setInvoice] = useState<string>("");
  const [amount, setAmount] = useState<bigint>(BigInt(0));
  const lnInvoiceRef = useRef<LnPaymentInvoice | null>(null);

  // const [sessionToken, setSessionToken] = useState<string>("");
  const { data: walletClient } = useWalletClient();
  function cleanAndClose() {
    lnInvoiceRef.current = null;
    setInvoice("");
    setActiveStep(1);
    setAmount(BigInt(0));
    onClose();
  }

  const { data: yourContract } = useScaffoldContract({
    contractName: "HashedTimelock",
    walletClient,
  });

  useEffect(() => {
    if (recieveContractId !== "") {
      // set the contract id to the contract
      if (hashLock === null) return;
      const secret = "0x" + hashLock.secret;
      yourContract?.write.withdraw([recieveContractId as `0x${string}`, secret as `0x${string}`]).then(() => {
        console.log("Withdrawn");
      });
    }
  }, [recieveContractId]);

  const [activeStep, setActiveStep] = useState<number>(1);

  function onClickQRCode() {
    navigator.clipboard.writeText(invoice);
    toastSuccess("Lightning Invoice Copied");
    // setActiveStep(activeStep + 1);
  }

  function onClickContinue() {
    setActiveStep(activeStep + 1);

    // genereate 32 random bytes in hex
    const secret = randomBytes(32);
    const hash = sha256.hex(secret);

    console.log("secret", secret);
    console.log("hash", hash);

    setHashLock({ secret: secret.toString("hex"), hash });
    console.log("hash", hash);
    console.log("secret", secret.toString("hex"));

    const msg: InitiationRequest = {
      kind: KIND.INITIATION,
      amount: Number(amount.toString()),
      recipient: walletClient?.account.address ?? "",
      hashlock: hash,
    };
    sendMessage(msg);
  }

  useEffect(() => {
    if (lnInitationResponse) {
      setInvoice(lnInitationResponse.lnInvoice);
    }
  }, [lnInitationResponse]);

  // function getPaymentHash(requestObject: PaymentRequestObject): `0x${string}` | undefined {
  //   // go through the tags and find the 'payment_hash' tagName and return the 'data'
  //   const paymentHash = requestObject.tags.find((tag: any) => tag.tagName === "payment_hash");
  //   if (!paymentHash) {
  //     return undefined;
  //   }
  //   return ("0x" + paymentHash.data.toString()) as `0x${string}`;
  // }

  // function handleInvoiceChange(invoice: string) {
  //   try {
  //     setInvoice(invoice);
  //     const tempdecoded = decode(invoice);
  //     const paymentHash = getPaymentHash(tempdecoded);

  //     if (!tempdecoded.satoshis) return;
  //     if (!paymentHash) return;
  //     if (!tempdecoded.timeExpireDate) return;

  //     console;

  //     lnInvoiceRef.current = {
  //       satoshis: tempdecoded.satoshis,
  //       timeExpireDate: tempdecoded.timeExpireDate,
  //       paymentHash,
  //       lnInvoice: invoice,
  //     };
  //   } catch (e) {
  //     console.error(e);
  //   }
  // }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-40 flex justify-center items-center font-mono">
          <div className="card lg:w-1/3 md:w-1/2 w-full bg-base-200 rounded-lg md:h-auto">
            <div className="flex w-full items-center justify-center relative text-white bg-brand-bg pt-4 rounded-t-lg">
              <span className="">{lnInvoiceRef.current == null ? "Recieve Lightning Payment" : "Review"}</span>
              <button
                onClick={cleanAndClose}
                className="btn-neutral absolute right-5 top-1/2 transform -translate-y-2 btn btn-circle btn-sm"
              >
                X
              </button>
            </div>
            <div className="flex flex-col items-center justify-center p-6">
              {/* Stepper Component */}
              <ul className="steps steps-vertical gap-0 auto-rows-min">
                <li className={`${activeStep >= 1 ? "step step-primary" : "step"} text-gray-400`}>
                  <div className="flex flex-col text-start">
                    {steps[0].title}
                    &nbsp;
                    <div className="flex ">
                      <IntegerInput value={amount} onChange={val => setAmount(BigInt(val))} disableMultiplyBy1e18 />
                      <button
                        className="btn btn-neutral justify-between rounded-none"
                        onClick={() => onClickContinue()}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </li>
                <li className={`${activeStep >= 2 ? "step step-primary " : "step flex"} text-gray-400`}>
                  <div className="flex flex-col text-start cursor-pointer w-full" onClick={() => onClickQRCode()}>
                    {steps[1].title}
                    &nbsp;
                    {activeStep === 2 && (
                      <div className="self-center">
                        <QRCode size={250} value={invoice} />
                      </div>
                    )}
                  </div>
                </li>
                <li className={`${activeStep >= 3 ? "step step-primary flex" : "step flex"} text-gray-400`}>
                  <div className="flex flex-col text-start cursor-pointer  w-full" onClick={() => onClickQRCode()}>
                    {steps[2].title}
                    &nbsp;
                    {activeStep === 3 && lnInitationResponse !== null && (
                      <div className="self-center">
                        <QRCode
                          size={250}
                          value={
                            "lnbc150n1pnz6xljpp5g8fudgfd3n7vty4d79ut6xcmkj6y5lpdwjma77zjt8rs66dery5qdqqcqzpuxqyz5vqsp5l9k8vwrl7plkrcd08zvu2h6ry8l0m82lepm8csneq08tadufatus9qyyssqgms4395l0vqs6nwg8cxjc48cadwfxmhjgxd5qnw0rqgcnvhwuvspswu3aarq64k039gw7zu6kerrw5t3mgd5ea5h5em00pz020hkp7qp5rsygh"
                          }
                        />
                      </div>
                    )}
                  </div>
                </li>
                <li className={`${activeStep >= 4 ? "step step-primary flex" : "step flex"} text-gray-400`}>
                  <div className="flex flex-col text-start">
                    {steps[3].title}
                    &nbsp;
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RecieveModal;
