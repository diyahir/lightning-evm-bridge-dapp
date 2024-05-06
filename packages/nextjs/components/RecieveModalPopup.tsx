"use client";

import { useEffect, useRef, useState } from "react";
import { AddressInput, IntegerInput } from "./scaffold-eth";
import { waitForTransaction } from "@wagmi/core";
import { PaymentRequestObject, decode } from "bolt11";
import { randomBytes } from "crypto";
import { sha256 } from "js-sha256";
import QRCode from "qrcode.react";
import { InitiationRequest, KIND, parseContractDetails } from "shared";
import { useWalletClient } from "wagmi";
import { useLightningApp } from "~~/hooks/LightningProvider";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { LnPaymentInvoice } from "~~/types/utils";

type RecieveModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function RecieveModal({ isOpen, onClose }: RecieveModalProps) {
  const {
    toastSuccess,
    toastError,
    sendMessage,
    lnInitationResponse,
    hashLock,
    hodlInvoiceResponse,
    setHashLock,
    recieveContractId,
  } = useLightningApp();
  const [invoice, setInvoice] = useState<string>("");
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<bigint>(BigInt(0));
  const lnInvoiceRef = useRef<LnPaymentInvoice | null>(null);
  const [txHash, setTxHash] = useState<string>("");

  const { data: walletClient } = useWalletClient();
  function cleanAndClose() {
    lnInvoiceRef.current = null;
    setInvoice("");
    setActiveStep(1);
    setAmount(BigInt(0));
    onClose();
  }

  const { data: htlcContract } = useScaffoldContract({
    contractName: "HashedTimelock",
    walletClient,
  });

  useEffect(() => {
    if (walletClient?.account.address && recipientAddress === "") {
      setRecipientAddress(walletClient.account.address);
    }
  }, [walletClient?.account.address]);

  useEffect(() => {
    console.log("Recieve Contract ID", recieveContractId);
    if (recieveContractId !== "" && htlcContract && hashLock) {
      // wait 5 seconds before continuing
      // Todo: Sad RPC calls are slow
      setTimeout(() => {
        console.log("Checking contract details");
        htlcContract.read.getContract([recieveContractId as `0x${string}`]).then((response: any) => {
          const contractDetails = parseContractDetails(response);
          console.log("Contract Details", contractDetails);
          // validate contract details
          if (contractDetails.receiver !== recipientAddress) {
            toastError("Invalid contract details");
            return;
          }

          if (contractDetails.amount !== BigInt(amount)) {
            toastError("Invalid contract details");
            return;
          }

          if (contractDetails.hashlock !== "0x" + hashLock.hash) {
            toastError("Invalid contract details");
            return;
          }

          if (contractDetails.withdrawn || contractDetails.refunded) {
            toastError("Invalid contract details");
            return;
          }

          if (Number(contractDetails.timelock) <= Date.now() / 1000) {
            toastError("Contract has expired");
            return;
          }

          const secret = "0x" + hashLock.secret;
          htlcContract.write
            .withdraw([recieveContractId as `0x${string}`, secret as `0x${string}`])
            .then(async (txHash: any) => {
              await waitForTransaction({
                hash: txHash,
              }).then(() => {
                setTxHash(txHash);
                setActiveStep(3);
              });
            });
        });
      }, 5000);
    }
  }, [recieveContractId]);

  useEffect(() => {
    if (activeStep === 1 && hodlInvoiceResponse !== null) {
      setActiveStep(2);
      setInvoice(hodlInvoiceResponse.lnInvoice);
    }
  }, [hodlInvoiceResponse]);

  const [activeStep, setActiveStep] = useState<number>(1);

  function onClickQRCode() {
    navigator.clipboard.writeText(invoice);
    toastSuccess("Lightning Invoice Copied");
    // setActiveStep(activeStep + 1);
  }

  function onClickContinue() {
    // genereate 32 random bytes in hex
    const secret = randomBytes(32);
    const hash = sha256.hex(secret);

    setHashLock({ secret: secret.toString("hex"), hash });

    const msg: InitiationRequest = {
      kind: KIND.INITIATION,
      amount: Number(amount.toString()),
      recipient: recipientAddress,
      hashlock: hash,
    };
    sendMessage(msg);
  }

  useEffect(() => {
    if (lnInitationResponse) {
      setInvoice(lnInitationResponse.lnInvoice);
    }
  }, [lnInitationResponse]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-40 flex justify-center items-center font-mono">
          <div className="card lg:w-1/3 md:w-1/2 w-full bg-base-200 rounded-lg md:h-auto min-w-fit">
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

              <ol className="flex items-center w-full p-3 space-x-2 text-sm font-medium text-center rounded-lg shadow-sm dark:text-gray-400 sm:text-base dark:bg-gray-800 dark:border-gray-700 sm:p-4 sm:space-x-4 rtl:space-x-reverse justify-between">
                <li
                  className={`flex items-center text-sm text-left ${
                    activeStep >= 1 ? "text-orange-600 dark:text-orange-500" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-5 h-5 me-2 text-xs border ${
                      activeStep >= 1
                        ? "border-orange-600 dark:border-orange-500"
                        : "border-gray-500 dark:border-gray-400"
                    } rounded-full shrink-0`}
                  >
                    1
                  </span>
                  Service <span className="hidden sm:inline-flex sm:ms-2">Fee</span>
                  <svg
                    className="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 12 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="m7 9 4-4-4-4M1 9l4-4-4-4"
                    />
                  </svg>
                </li>
                <li
                  className={`flex items-center text-sm text-left ${
                    activeStep >= 2 ? "text-orange-600 dark:text-orange-500" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-5 h-5 me-2 text-xs border ${
                      activeStep >= 2
                        ? "border-orange-600 dark:border-orange-500"
                        : "border-gray-500 dark:border-gray-400"
                    } rounded-full shrink-0`}
                  >
                    2
                  </span>
                  Pay <span className="hidden sm:inline-flex sm:ms-2">Invoice</span>
                  <svg
                    className="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 12 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="m7 9 4-4-4-4M1 9l4-4-4-4"
                    />
                  </svg>
                </li>
                <li
                  className={`flex items-center text-sm text-left ${
                    activeStep >= 3 ? "text-orange-600 dark:text-orange-500" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-5 h-5 me-2 text-xs border ${
                      activeStep >= 3
                        ? "border-orange-600 dark:border-orange-500"
                        : "border-gray-500 dark:border-gray-400"
                    } rounded-full shrink-0`}
                  >
                    3
                  </span>
                  Received<span className="hidden sm:inline-flex sm:ms-2"></span>
                </li>
              </ol>

              {activeStep === 1 &&
                step1({
                  amount,
                  invoice,
                  recipientAddress,
                  setRecipientAddress,
                  setAmount,
                  onClickContinue,
                  onClickQRCode,
                })}

              {activeStep === 2 && step2({ invoice, onClickQRCode })}

              {activeStep === 3 && step3({ txHash })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function step1({
  amount,
  invoice,
  recipientAddress,
  setRecipientAddress,
  setAmount,
  onClickContinue,
  onClickQRCode,
}: {
  amount: bigint;
  invoice: string;
  recipientAddress: string;
  setRecipientAddress: (val: string) => void;
  setAmount: (val: bigint) => void;
  onClickContinue: () => void;
  onClickQRCode: () => void;
}) {
  let paymentRequest: PaymentRequestObject = {
    satoshis: Number(0),
    tags: [{ tagName: "payment_hash", data: "abc123" }],
  };
  if (invoice !== "") {
    paymentRequest = decode(invoice);
  }

  function isGenerateQRDisabled(): boolean {
    return amount === BigInt(0) || invoice !== "";
  }
  return (
    <div className="flex flex-col text-start w-full gap-2">
      <div className="flex-col">
        <span className="text-sm text-gray-500">Recipient Address</span>
        <AddressInput
          placeholder="0x123...321"
          value={recipientAddress}
          onChange={newAddress => {
            setRecipientAddress(newAddress);
          }}
          disabled={invoice !== ""}
        />
      </div>
      <div className="flex-col">
        <span className="text-sm text-gray-500">Amount (sats)</span>
        <IntegerInput
          value={amount}
          onChange={val => setAmount(BigInt(val))}
          disableMultiplyBy1e18
          disabled={invoice !== ""}
        />
      </div>
      <button
        className="btn btn-secondary rounded-none w-full"
        disabled={isGenerateQRDisabled()}
        onClick={() => onClickContinue()}
      >
        Generate Service Fee Invoice
      </button>
      {invoice && (
        <div className="flex flex-col w-full gap-2 h-full">
          <button
            className="btn btn-neutral rounded-none text-center w-full"
            onClick={() => {
              onClickQRCode();
            }}
          >
            Copy Invoice
          </button>
          <div className="flex flex-col items-center">
            <QRCode size={250} value={invoice} className="" />
          </div>
          <div className="flex flex-col">
            <span className="text-center text-gray-500">Service Fee: {paymentRequest.satoshis} sats</span>
          </div>
        </div>
      )}
    </div>
  );
}

function step2({ invoice, onClickQRCode }: { invoice: string; onClickQRCode: () => void }) {
  let paymentRequest: PaymentRequestObject = {
    satoshis: Number(0),
    tags: [{ tagName: "payment_hash", data: "abc123" }],
  };
  if (invoice !== "") {
    paymentRequest = decode(invoice);
  }
  return (
    <div className="flex flex-col text-start cursor-pointer w-full" onClick={() => onClickQRCode()}>
      &nbsp;
      <div className="flex flex-col self-center gap-2">
        <QRCode size={250} value={invoice} />
        <button className="btn btn-neutral rounded-none w-full text-center" onClick={() => onClickQRCode()}>
          Copy Invoice
        </button>
        <div className="flex flex-col">
          <span className="text-center text-gray-500">Invoice: {paymentRequest.satoshis} sats</span>
        </div>
      </div>
    </div>
  );
}

function step3({ txHash }: { txHash: string }) {
  return (
    <div className="flex flex-col text-start w-full gap-2">
      <a
        href={`https://3xpl.com/botanix/transaction/${txHash}`}
        target="_blank"
        rel="noreferrer"
        className="btn btn-secondary rounded-none w-full"
      >
        View Transaction
      </a>
    </div>
  );
}

export default RecieveModal;
