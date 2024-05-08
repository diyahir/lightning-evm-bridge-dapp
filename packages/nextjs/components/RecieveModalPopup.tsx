"use client";

import { useEffect, useRef, useState } from "react";
import { Step1 } from "./recieve-steps/Step1";
import { Step2 } from "./recieve-steps/Step2";
import { Step3 } from "./recieve-steps/Step3";
import {
  InitiationRequest,
  KIND,
  RelayRequest,
  RelayResponse,
  parseContractDetails,
} from "@lightning-evm-bridge/shared";
import { waitForTransaction } from "@wagmi/core";
import axios from "axios";
import { randomBytes } from "crypto";
import { sha256 } from "js-sha256";
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

  function relayContractAndPreimage() {
    // send a request to the relayer to get the contract details
    const msg: RelayRequest = {
      kind: KIND.RELAY_REQUEST,
      contractId: recieveContractId,
      preimage: hashLock?.secret ?? "",
    };

    axios.post("http://localhost:3004/relay", msg).then(response => {
      console.log(response);
      const msg: RelayResponse = response.data;
      if (msg.status === "success" && msg.txHash) {
        setActiveStep(3);
        setTxHash(msg.txHash);
        console.log("Relay Response", msg);
      } else {
        toastError("Failed to relay contract and preimage");
      }
    });

    return;
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
    if (recieveContractId === "") {
      return;
    }

    const retryDelay = 5000; // Delay time in milliseconds
    const maxRetries = 3; // Maximum number of retries

    const fetchContractDetails = async (retries = maxRetries) => {
      relayContractAndPreimage();
      if (retryDelay > 0) {
        return;
      }
      // send a request to the relayer to get the contract details

      if (recieveContractId === "" || !htlcContract || !hashLock) {
        return;
      }

      console.log("Checking contract details");

      try {
        const response = await htlcContract.read.getContract([`${recieveContractId}` as `0x${string}`]);
        const contractDetails = parseContractDetails(response);
        console.log("Contract Details", contractDetails);

        // Validate contract details
        if (
          contractDetails.receiver !== recipientAddress ||
          contractDetails.amount !== BigInt(amount) ||
          contractDetails.hashlock !== `0x${hashLock.hash}` ||
          contractDetails.withdrawn ||
          contractDetails.refunded ||
          Number(contractDetails.timelock) <= Date.now() / 1000
        ) {
          toastError("Invalid contract details");
          return;
        }

        const secret = `0x${hashLock.secret}`;
        console.log("Withdrawing contract", recieveContractId, secret);
        const txHash = await htlcContract.write.withdraw([
          `${recieveContractId}` as `0x${string}`,
          secret as `0x${string}`,
        ]);
        await waitForTransaction({ hash: txHash });
        setTxHash(txHash);
        setActiveStep(3);
      } catch (error) {
        console.error("Failed to fetch contract details:", error);
        if (retries > 0) {
          console.log(`Retrying... ${retries} retries left`);
          setTimeout(() => fetchContractDetails(retries - 1), retryDelay);
        } else {
          toastError("Failed to process contract after several attempts.");
        }
      }
    };

    setTimeout(() => {
      fetchContractDetails();
    }, 5000); // Initial delay before the first attempt
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
  }

  function onClickContinue() {
    // genereate 32 random bytes in hex
    const secret = randomBytes(32);
    const hash = sha256.hex(secret);

    setHashLock({ secret: secret.toString("hex"), hash });

    const msg: InitiationRequest = {
      kind: KIND.INITIATION_RECIEVE,
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
                    activeStep >= 1 ? "text-blue-400 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-5 h-5 me-2 text-xs border ${
                      activeStep >= 1 ? "border-blue-400 dark:border-blue-300" : "border-gray-500 dark:border-gray-400"
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
                    activeStep >= 2 ? "text-blue-400 dark:text-blue-300" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-5 h-5 me-2 text-xs border ${
                      activeStep >= 2 ? "border-blue-400 dark:border-blue-300" : "border-gray-500 dark:border-gray-400"
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
                    activeStep >= 3 ? "text-blue-400 dark:text-blue-300" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-5 h-5 me-2 text-xs border ${
                      activeStep >= 3 ? "border-blue-400 dark:border-blue-300" : "border-gray-500 dark:border-gray-400"
                    } rounded-full shrink-0`}
                  >
                    3
                  </span>
                  Received<span className="hidden sm:inline-flex sm:ms-2"></span>
                </li>
              </ol>

              {activeStep === 1 &&
                Step1({
                  amount,
                  invoice,
                  recipientAddress,
                  setRecipientAddress,
                  setAmount,
                  onClickContinue,
                  onClickQRCode,
                })}

              {activeStep === 2 && Step2({ invoice, onClickQRCode })}

              {activeStep === 3 && Step3({ txHash })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RecieveModal;
