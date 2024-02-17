export type InvoiceRequest = {
  contractId: string;
  lnInvoice: string;
};

export interface InvoiceResponse {
  status: "success" | "error";
  message: string;
}

export type ContractDetails = {
  sender: string;
  receiver: string;
  amount: BigInt;
  hashlock: string;
  timelock: BigInt;
  withdrawn: boolean;
  refunded: boolean;
  preimage: string;
};
