export type ProviderConfig = {
  minSats: number;
  maxSats: number;
  sendBaseFee: number;
  sendBasisPointFee: number; // 100 = 1%
  secondsTillInvoiceExpires: number;
  maxLNFee: number;
  recieveBaseFee: number;
  recieveBasisPointFee: number;
};

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
