import React from "react";
import { useLightningApp } from "~~/hooks/LightningProvider";
import { LnPaymentInvoice } from "~~/types/utils";

/**
 * Site footer
 */
type PaymentInvoiceProps = {
  invoice: LnPaymentInvoice;
  contractId: string | null;
  expiryDate: string;
  submitPayment: () => void;
  cancelPayment: () => void;
  step: number;
};

export const steps = [
  { title: "Verify Invoice", description: "Verify the invoice is correct" },
  { title: "Pay deposit", description: "On-chain invoice locked in smart contract" },
  {
    title: "Waiting to be included in a block",
    description: "The invoice id is sent and verified by the lightning provider",
  },
  { title: "Paid", description: "The lightning provider pays lightning invoice. The reciever must be online." },
];

export const PaymentInvoice = ({ invoice, submitPayment, cancelPayment, step }: PaymentInvoiceProps) => {
  const expiryDate = new Date(invoice.timeExpireDate * 1000);
  const { price } = useLightningApp();

  // Assuming steps is an array of step objects used in your Stepper

  return (
    <div className="flex h-full flex-col justify-evenly content-evenly gap-5">
      <table className="w-full text-white text-sm">
        <tbody>
          <tr>
            <td className="border-transparent">Expiry Time</td>
            <td className="border-transparent text-right">{expiryDate.toLocaleString()}</td>
          </tr>
          <tr>
            <td className="border-transparent">Amount</td>
            <td className="border-transparent text-right">{invoice.satoshis} sats</td>
          </tr>
          <tr>
            <td className="border-transparent">USD</td>
            <td className="border-transparent text-right">${((invoice.satoshis * price) / 100_000_000).toFixed(3)}</td>
          </tr>
          <tr>
            <td className="border-transparent">Service Fee</td>
            <td className="border-transparent text-right">0 sats</td>
          </tr>
        </tbody>
      </table>

      {/* Stepper Component */}
      {/* You'll need to adapt or implement your own stepper logic with Tailwind CSS */}
      <ul className="steps steps-vertical">
        {steps.map((stepInfo, index) => (
          <li
            // data-content={index === step ? "" : index + 1}
            key={index}
            className={`${index < step ? "step step-primary" : "step"} text-gray-400`}
          >
            <div className="flex flex-col text-start">
              {stepInfo.title}
              &nbsp;
              {step === index && <span className="loading loading-dots"></span>}
            </div>
          </li>
        ))}
      </ul>

      {/* Buttons */}
      {step < 2 ? (
        <div className="w-full flex justify-between">
          <button
            className={`btn btn-outline btn-error w-2/5 text-white ${
              step !== 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => cancelPayment()}
            disabled={step == 2 || step == 3}
          >
            Cancel
          </button>
          <button
            className={`btn btn-success bg-emerald-700 w-2/5 text-white ${
              step !== 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => submitPayment()}
            disabled={step == 2 || step == 3}
          >
            Pay
          </button>
        </div>
      ) : (
        <button
          className="btn btn-neutral  w-full text-white "
          onClick={() => cancelPayment()}
          disabled={step == 2 || step == 3}
        >
          Close
        </button>
      )}
    </div>
  );
};
