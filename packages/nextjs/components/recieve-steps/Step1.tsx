import { AddressInput, IntegerInput } from "../scaffold-eth";
import { PaymentRequestObject, decode } from "bolt11";
import QRCode from "qrcode.react";

export function Step1({
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
