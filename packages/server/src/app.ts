import * as WebSocket from "ws";
import lnService from "ln-service";
import dotenv from "dotenv";
import { ethers } from "ethers";
import { decode } from "bolt11";
import { validateLnInvoiceAndContract } from "./utils/validation";
import { InvoiceRequest, ContractDetails, GWEIPERSAT } from "./types/types";
import deployedContracts from "./contracts/deployedContracts";
import { providerConfig } from "./provider.config";

dotenv.config();

// Verify environment variables
const { PORT, LND_MACAROON, LND_SOCKET, RPC_URL, LSP_PRIVATE_KEY, CHAIN_ID } =
  process.env;
if (!RPC_URL || !LSP_PRIVATE_KEY || !CHAIN_ID) {
  console.error("Missing environment variables");
  process.exit(1);
}

// Initialize services
const wss = new WebSocket.Server({ port: Number(PORT) || 3003 });
const { lnd } = lnService.authenticatedLndGrpc({
  cert: "",
  macaroon: LND_MACAROON,
  socket: LND_SOCKET,
});

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(LSP_PRIVATE_KEY, provider);
const htlcContractInfo = deployedContracts[CHAIN_ID]?.HashedTimelock;
const htlcContract = new ethers.Contract(
  htlcContractInfo.address,
  htlcContractInfo.abi,
  signer
);

export type CachedPayment = {
  contractId: string;
  secret: string;
};

let cachedPayments: CachedPayment[] = [];
let pendingContracts: string[] = [];
// ideally this should be stored in a database, but for the sake of simplicity we are using an in-memory cache

console.log(`RPC Provider is running on ${RPC_URL}`);
console.log(`WebSocket server is running on ws://localhost:${PORT || 3003}`);
console.log(`LSP Address: ${signer.address}`);

wss.on("connection", (ws: WebSocket) => {
  const serverStatus = process.env.LND_MACAROON ? "ACTIVE" : "MOCK";
  console.log("Client connected");
  ws.send(
    JSON.stringify({
      serverStatus: serverStatus,
      message: "Connected to server",
    })
  );

  ws.on("message", async (message: string) => {
    console.log("Received message:", message);
    const request: InvoiceRequest = JSON.parse(message);
    if (pendingContracts.includes(request.contractId)) {
      ws.send(
        JSON.stringify({
          status: "error",
          message: "Contract is already being processed.",
        })
      );
      return;
    }
    pendingContracts.push(request.contractId);
    try {
      await processInvoiceRequest(request, ws);
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(JSON.stringify({ status: "error", message: "Invalid request" }));
    }
    pendingContracts = pendingContracts.filter((c) => c !== request.contractId);
  });

  ws.on("close", () => console.log("Client disconnected"));
});

async function processInvoiceRequest(request: InvoiceRequest, ws: WebSocket) {
  if (!request.contractId || !request.lnInvoice) {
    ws.send(
      JSON.stringify({ status: "error", message: "Invalid Invoice Request" })
    );
    return;
  }

  console.log("Invoice Request Received:", request);

  // Check if LND_MACAROON and LND_SOCKET are empty to simulate mock mode
  if (!process.env.LND_MACAROON && !process.env.LND_SOCKET) {
    console.log("Mock Server Mode: Simulating payment success");

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay for realism

    // Directly respond with a simulated success message
    ws.send(
      JSON.stringify({
        status: "success",
        message: "Invoice paid successfully in mock mode.",
      })
    );

    // Exit early since we're in mock mode
    return;
  }

  try {
    const options = { gasPrice: ethers.parseUnits("0.001", "gwei") };

    const contractExists = await htlcContract.haveContract(request.contractId);
    if (!contractExists) {
      ws.send(
        JSON.stringify({ status: "error", message: "Contract does not exist." })
      );
      return;
    }

    const lnInvoiceDetails = decode(request.lnInvoice);
    console.log("LN Invoice Details:", lnInvoiceDetails);

    const contractDetails: ContractDetails = await getContractDetails(
      request.contractId,
      htlcContract
    );
    console.log("Contract Details:", contractDetails);

    const validation = validateLnInvoiceAndContract(
      lnInvoiceDetails,
      contractDetails
    );

    if (!validation.isValid) {
      console.log("Invoice and Contract are invalid:", validation.message);
      ws.send(
        JSON.stringify({
          status: "error",
          message: validation.message,
        })
      );
      return;
    }

    console.log("Invoice and Contract are valid, proceeding with payment");
    const paymentResponse = await lnService.pay({
      lnd,
      request: request.lnInvoice,
      max_fee: providerConfig.maxLNFee,
    });
    console.log("Payment Response:", paymentResponse);
    ws.send(
      JSON.stringify({
        status: "success",
        message: "Invoice paid successfully.",
      })
    );
    // Critical point, if this withdraw fails, the LSP will lose funds
    // We should cache the paymentResponse.secret and request.contractId and retry the withdrawal if it fails
    await htlcContract
      .withdraw(request.contractId, "0x" + paymentResponse.secret, options)
      .then((tx: any) => {
        console.log("Withdrawal Transaction:", tx);
      })
      .catch((error: any) => {
        console.error("Withdrawal Error:", error);
        cachedPayments.push({
          contractId: request.contractId,
          secret: paymentResponse.secret,
        });
      });
    console.log("Payment processed successfully");
  } catch (error) {
    console.error("Error during invoice processing:", error);
    ws.send(
      JSON.stringify({ status: "error", message: "Failed to process invoice." })
    );
  }
}

async function getContractDetails(
  contractId: string,
  htlcContract: ethers.Contract
): Promise<ContractDetails> {
  const response: any = await htlcContract.getContract(contractId);
  return {
    sender: response[0],
    receiver: response[1],
    amount: BigInt(Number(response[2]) / GWEIPERSAT),
    hashlock: response[3],
    timelock: response[4],
    withdrawn: response[5],
    refunded: response[6],
    preimage: response[7],
  };
}

// Function to process cached payments
async function processCachedPayments() {
  console.log(`Processing ${cachedPayments.length} cached payments...`);
  for (let i = 0; i < cachedPayments.length; i++) {
    const payment = cachedPayments[i];
    try {
      console.log(
        `Attempting to withdraw for contractId: ${payment.contractId}`
      );
      const options = { gasPrice: ethers.parseUnits("0.001", "gwei") };
      await htlcContract
        .withdraw(payment.contractId, "0x" + payment.secret, options)
        .then((tx) => {
          console.log("Withdrawal Transaction Success:", tx);
          // Remove the successfully processed payment from the cache
          cachedPayments = cachedPayments.filter(
            (p) => p.contractId !== payment.contractId
          );
        })
        .catch(async (error) => {
          // try again with a higher gas price
          // carefull consideration should be given to the gas price
          await htlcContract.withdraw(
            payment.contractId,
            "0x" + payment.secret
          );
        });
    } catch (error) {
      console.error(
        `Error processing cached payment for contractId ${payment.contractId}:`,
        error
      );
      // Handle any unexpected errors here
    }
  }
}

// Poll every 30 seconds
setInterval(processCachedPayments, 30000);
