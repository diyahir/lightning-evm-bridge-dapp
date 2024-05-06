import { ethers } from "ethers";
import { AuthenticatedLnd } from "lightning";
import { ServerStatus } from "shared";

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



export type validationResponse = {
  isValid: boolean;
  message: string;
};

export type CachedPayment = {
  contractId: string;
  secret: string;
};

export type ServerState = {
  lnd: AuthenticatedLnd;
  htlcContract: ethers.Contract;
  cachedPayments: CachedPayment[];
  pendingContracts: string[];
  serverStatus: ServerStatus;
};
