import { PaymentRequestObject, decode } from "bolt11";
import QRCode from "qrcode.react";

export function Step2({ invoice, onClickQRCode }: { invoice: string; onClickQRCode: () => void }) {
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
