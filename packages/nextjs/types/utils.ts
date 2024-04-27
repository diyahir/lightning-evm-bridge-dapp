import { ServerStatus } from "shared";

export type Tuple<T, MaxLength extends number = 10, Current extends T[] = []> = Current["length"] extends MaxLength
  ? Current
  : Current | Tuple<T, MaxLength, [T, ...Current]>;

export type LnPaymentInvoice = {
  satoshis: number;
  timeExpireDate: number;
  paymentHash: `0x${string}`;
  lnInvoice: string;
};

export interface ConnectionResponse {
  serverStatus: ServerStatus;
}
