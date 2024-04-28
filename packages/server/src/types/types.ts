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

export const GWEIPERSAT = 1e10;

export type validationResponse = {
  isValid: boolean;
  message: string;
};
