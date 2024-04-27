import { PaymentRequestObject } from "bolt11";
import { ContractDetails } from "../types/types";
import { providerConfig } from "../provider.config";

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
      message: "Invoice amount is greater than contract amount",
    };
  }
  if (lnInvoiceDetails.satoshis > providerConfig.maxSats) {
    return {
      isValid: false,
      message: `Invoice amount is higher than ${providerConfig.maxSats} satoshis ;(`,
    };
  }
  if (lnInvoiceDetails.satoshis < providerConfig.minSats) {
    return {
      isValid: false,
      message: `Invoice amount is less than ${providerConfig.minSats} satoshis ;(`,
    };
  }
  if (
    getContractAmountFromInvoice(Number(contractDetails.amount)) <
    lnInvoiceDetails.satoshis
  ) {
    return {
      isValid: false,
      message: `Invoice amount is greater than contract amount`,
    };
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (lnInvoiceDetails.timeExpireDate < currentTimestamp) {
    return { isValid: false, message: "Invoice has expired" };
  }

  if (Number(contractDetails.timelock) < currentTimestamp) {
    return { isValid: false, message: "Contract has expired" };
  }

  if (
    Number(contractDetails.timelock) - currentTimestamp <
    providerConfig.secondsTillInvoiceExpires
  ) {
    return { isValid: false, message: "Insufficient buffer to claim contract" };
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

export function getContractAmountFromInvoice(satsInInvoice: number) {
  return (
    satsInInvoice * (1 + providerConfig.basisPointFee / 10000) +
    providerConfig.baseFee
  );
}
