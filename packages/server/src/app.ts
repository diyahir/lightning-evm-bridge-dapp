import * as WebSocket from "ws";
import lnService from "ln-service";
import dotenv from "dotenv";
import { ethers } from "ethers";
import { decode } from "bolt11";
import { validateLnInvoiceAndContract } from "./utils/validation";
import { InvoiceRequest, ContractDetails } from "./types";
import deployedContracts from "./contracts/deployedContracts";

dotenv.config();

// Verify environment variables
const { PORT, MACAROON, SOCKET, ETH_PROVIDER_URL, PRIVATE_KEY, CHAIN_ID } =
  process.env;
if (!MACAROON || !SOCKET || !ETH_PROVIDER_URL || !PRIVATE_KEY || !CHAIN_ID) {
  console.error("Missing environment variables");
  process.exit(1);
}

// Initialize services
const wss = new WebSocket.Server({ port: Number(PORT) || 3003 });
const { lnd } = lnService.authenticatedLndGrpc({
  cert: "",
  macaroon: MACAROON,
  socket: SOCKET,
});
const provider = new ethers.JsonRpcProvider(ETH_PROVIDER_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const htlcContractInfo = deployedContracts[CHAIN_ID]?.HashedTimelock;
const htlcContract = new ethers.Contract(
  htlcContractInfo.address,
  htlcContractInfo.abi,
  signer
);

console.log(`RPC Provider is running on ${ETH_PROVIDER_URL}`);
console.log(`WebSocket server is running on ws://localhost:${PORT || 3003}`);

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");
  ws.send("Server online: You are now connected!");

  ws.on("message", async (message: string) => {
    console.log("Received message:", message);
    try {
      const request: InvoiceRequest = JSON.parse(message);
      await processInvoiceRequest(request, ws);
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(JSON.stringify({ status: "error", message: "Invalid request" }));
    }
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

  try {
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

    if (!validateLnInvoiceAndContract(lnInvoiceDetails, contractDetails)) {
      console.log("Invalid Invoice or Contract");
      ws.send(
        JSON.stringify({
          status: "error",
          message: "Invalid Invoice or Contract",
        })
      );
      return;
    }

    console.log("Invoice and Contract are valid, proceeding with payment");
    const paymentResponse = await lnService.pay({
      lnd,
      request: request.lnInvoice,
    });
    console.log("Payment Response:", paymentResponse);

    await htlcContract.withdraw(
      request.contractId,
      "0x" + paymentResponse.secret
    );
    ws.send(
      JSON.stringify({
        status: "success",
        message: "Invoice paid successfully.",
      })
    );
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
    amount: response[2],
    hashlock: response[3],
    timelock: response[4],
    withdrawn: response[5],
    refunded: response[6],
    preimage: response[7],
  };
}
