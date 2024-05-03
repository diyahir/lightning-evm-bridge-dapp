export type ClientRequest = InvoiceRequest | InitiationRequest;

export interface InvoiceRequest {
  kind: KIND.INVOICE_SEND;
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
  kind: KIND.HODL_RES;
  lnInvoice: string;
}

export interface HodlInvoiceContractResponse {
  kind: KIND.HODL_CONTRACT_RES;
  contractId: string;
}

export enum KIND {
  INVOICE_SEND = "invoice_send",
  INITIATION = "initiation",
  HODL_RES = "hodl_res",
  HODL_CONTRACT_RES = "hodl_contract_res",
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

export type ServerResponse =
  | InvoiceResponse
  | ConnectionResponse
  | HodlInvoiceResponse
  | HodlInvoiceContractResponse;

export const GWEIPERSAT = 1e10;