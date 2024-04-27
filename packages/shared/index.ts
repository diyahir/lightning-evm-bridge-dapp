export type ClientRequest = InvoiceRequest | InitiationRequest;

export interface InvoiceRequest {
  kind: KIND.INVOICE;
  contractId: string;
  lnInvoice: string;
}

export interface InitiationRequest {
  kind: KIND.INITIATION;
  amount: number;
}

export enum KIND {
  INVOICE = "invoice",
  INITIATION = "initiation",
}

export interface InvoiceResponse {
  status: "success" | "error";
  message: string;
}

export enum ServerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  MOCK = "MOCK",
}
