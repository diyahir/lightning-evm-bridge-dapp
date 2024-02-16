import { PaymentRequestObject } from "bolt11";
import { ContractDetails } from "../types";

export function validateLnInvoiceAndContract(
  lnInvoiceDetails: PaymentRequestObject,
  contractDetails: ContractDetails
) {
  if (lnInvoiceDetails.satoshis < Number(contractDetails.amount)) {
    return false;
  }
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (lnInvoiceDetails.timeExpireDate < currentTimestamp) {
    return false;
  }

  if (Number(contractDetails.timelock) < currentTimestamp) {
    return false;
  }

  if (getPaymentHash(lnInvoiceDetails) !== contractDetails.hashlock) {
    return false;
  }

  if (contractDetails.withdrawn || contractDetails.refunded) {
    return false;
  }

  if (
    contractDetails.preimage !==
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  ) {
    return false;
  }

  return true;
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

async function getContractDetails(
  contractId: string
): Promise<ContractDetails> {
  const response = await htlcContract.getContract(contractId);
  return {
    sender: response[0],
    receiver: response[1],
    amount: response[2],
    hashlock: response[3],
    timelock: response[4],
    withdrawn: response[5],
    refunded: response[6],
    preimage: response[7],
  };
}
