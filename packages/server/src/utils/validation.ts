import { PaymentRequestObject } from "bolt11";
import { ContractDetails } from "../types";

type validationResponse = {
  isValid: boolean;
  message: string;
};

export function validateLnInvoiceAndContract(
  lnInvoiceDetails: PaymentRequestObject,
  contractDetails: ContractDetails
): validationResponse {
  if (lnInvoiceDetails.satoshis > Number(contractDetails.amount)) {
    return {
      isValid: false,
      message: "Invoice amount is less than contract amount",
    };
  }
  if (lnInvoiceDetails.satoshis > 42) {
    return {
      isValid: false,
      message: "Invoice amount is higher than 42 satoshis ;(",
    };
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (lnInvoiceDetails.timeExpireDate < currentTimestamp) {
    return { isValid: false, message: "Invoice has expired" };
  }

  if (Number(contractDetails.timelock) < currentTimestamp) {
    return { isValid: false, message: "Contract has expired" };
  }

  if (getPaymentHash(lnInvoiceDetails) !== contractDetails.hashlock) {
    return { isValid: false, message: "Hashlock mismatch" };
  }

  if (contractDetails.withdrawn || contractDetails.refunded) {
    return {
      isValid: false,
      message: "Contract has been withdrawn or refunded",
    };
  }

  if (
    contractDetails.preimage !==
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  ) {
    return { isValid: false, message: "Contract has been withdrawn" };
  }

  return { isValid: true, message: "Invoice and Contract are valid" };
}

export function getPaymentHash(
  requestObject: PaymentRequestObject
): `0x${string}` | undefined {
  // go through the tags and find the 'payment_hash' tagName and return the 'data'
  const paymentHash = requestObject.tags.find(
    (tag) => tag.tagName === "payment_hash"
  );
  if (!paymentHash) {
    return undefined;
  }
  return ("0x" + paymentHash.data.toString()) as `0x${string}`;
}
