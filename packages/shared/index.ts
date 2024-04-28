export type ClientRequest = InvoiceRequest | InitiationRequest;

export interface InvoiceRequest {
  kind: KIND.INVOICE;
  contractId: string;
  lnInvoice: string;
}

export interface InitiationRequest {
  kind: KIND.INITIATION;
  amount: number;
  recipient: string;
  hashlock: string;
}

export interface InitiationResponse {
  lnInvoice: string;
}

export interface HodlInvoiceResponse {
  lnInvoice: string;
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

export interface ConnectionResponse {
  serverStatus: ServerStatus;
  uuid: string;
  message: string;
}
