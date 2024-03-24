export type Tuple<T, MaxLength extends number = 10, Current extends T[] = []> = Current["length"] extends MaxLength
  ? Current
  : Current | Tuple<T, MaxLength, [T, ...Current]>;

export type LnPaymentInvoice = {
  satoshis: number;
  timeExpireDate: number;
  paymentHash: `0x${string}`;
  lnInvoice: string;
};

export type InvoiceRequest = {
  contractId: string;
  lnInvoice: string;
};

export interface InvoiceResponse {
  status: "success" | "error";
  message: string;
}

export enum ServerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  MOCK = "MOCK",
}
