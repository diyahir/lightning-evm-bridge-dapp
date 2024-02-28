export type ProviderConfig = {
  minSats: number;
  maxSats: number;
  baseFee: number;
  basisPointFee: number; // 100 = 1%
  secondsTillInvoiceExpires: number;
  maxLNFee: number;
};

export const providerConfig: ProviderConfig = {
  minSats: 2,
  maxSats: 42,
  baseFee: 0, // 100 = 1%
  basisPointFee: 0,
  secondsTillInvoiceExpires: 3 * 60,
  maxLNFee: 100,
};
