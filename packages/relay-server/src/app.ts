import {
  ContractDetails,
  KIND,
  RelayRequest,
  parseContractDetails,
  deployedContracts,
  RelayResponse,
} from "@lightning-evm-bridge/shared";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { ethers } from "ethers";
import cors from "cors";
import { sha256 } from "js-sha256";

dotenv.config();

const { PORT, RPC_URL, LSP_PRIVATE_KEY, CHAIN_ID } = process.env;

if (!RPC_URL || !LSP_PRIVATE_KEY || !CHAIN_ID || !PORT) {
  console.error("Missing environment variables");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(LSP_PRIVATE_KEY, provider);
const htlcContractInfo = deployedContracts[CHAIN_ID]?.HashedTimelock;
const htlcContract = new ethers.Contract(
  htlcContractInfo.address,
  htlcContractInfo.abi,
  signer
);

const app = express();

// Middleware to parse JSON bodies
app.use(cors());
app.use(bodyParser.json());

// Post route to handle relay requests
app.post("/relay", async (req: Request, res: Response) => {
  try {
    const { kind, contractId, preimage } = req.body as RelayRequest;

    if (kind === KIND.RELAY_REQUEST && contractId && preimage) {
      console.log(
        `Received relay request for contract ID: ${contractId} with preimage: ${preimage}`
      );

      if (await validateContractAndPreimage(contractId, preimage)) {
        const options = { gasPrice: ethers.parseUnits("0.001", "gwei") };

        await htlcContract
          .withdraw(contractId, "0x" + preimage, options)
          .then(async (tx: any) => {
            await tx.wait().then(async () => {
              console.log("Withdrawal Transaction:", tx);

              const msg: RelayResponse = {
                kind: KIND.RELAY_RESPONSE,
                status: "success",
                txHash: tx.hash,
              };
              // Insert your logic here to interact with the smart contract
              res.status(200).send(msg);
            });
          })
          .catch((error: any) => {
            console.error("Withdrawal Error:", error);
            res.status(500).send({ message: "Failed to withdraw contract" });
          });
      } else {
        res
          .status(400)
          .send({ message: "Unable to validate contract and preimage" });
        return;
      }
    } else {
      res.status(400).send({ message: "Invalid request" });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

async function validateContractAndPreimage(
  contractId: string,
  preimage: string
) {
  const contractDetails: ContractDetails = await getContractDetails(contractId);

  console.log("Contract Details:", contractDetails);

  if (!contractDetails) {
    console.error("Contract not found");
    return false;
  }

  const hash = sha256.hex(Buffer.from(preimage, "hex"));

  if (contractDetails.hashlock !== "0x" + hash) {
    console.error("Preimage does not match");
    return false;
  }

  if (contractDetails.withdrawn) {
    console.error("Contract already withdrawn");
    return false;
  }

  if (contractDetails.refunded) {
    console.error("Contract already refunded");
    return false;
  }

  return true;
}

async function getContractDetails(
  contractId: string
): Promise<ContractDetails> {
  const response: any = await htlcContract.getContract(contractId);
  return parseContractDetails(response);
}
