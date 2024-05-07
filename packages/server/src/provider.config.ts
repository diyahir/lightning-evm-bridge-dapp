import { ProviderConfig } from "@lightning-evm-bridge/shared";

export const providerConfig: ProviderConfig = {
  minSats: 2,
  maxSats: 42,
  sendBaseFee: 0, // 100 = 1%
  sendBasisPointFee: 0,
  secondsTillInvoiceExpires: 3 * 60,
  maxLNFee: 100,
  recieveBaseFee: 10,
  recieveBasisPointFee: 0,
};
