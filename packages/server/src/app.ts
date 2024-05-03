import * as WebSocket from "ws";
import dotenv from "dotenv";
import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";
import deployedContracts from "./contracts/deployedContracts";
import { match } from "ts-pattern";
import { ClientRequest, ConnectionResponse, KIND, ServerStatus } from "shared";
import { processClientInvoiceRequest } from "./utils/lightningSendUtils";
import { processClientLightningRecieveRequest } from "./utils/lightningRecieveUtils";
import { CachedPayment, ServerState } from "./types/types";
import { authenticatedLndGrpc } from "lightning";
dotenv.config();

// Verify environment variables
const {
  PORT,
  LND_MACAROON,
  LND_SOCKET,
  RPC_URL,
  LSP_PRIVATE_KEY,
  CHAIN_ID,
  LND_TLS_CERT,
} = process.env;
if (!RPC_URL || !LSP_PRIVATE_KEY || !CHAIN_ID) {
  console.error("Missing environment variables");
  process.exit(1);
}

// Initialize services
const wss = new WebSocket.Server({
  port: Number(PORT) || 3003,
  clientTracking: true,
});

const { lnd } = authenticatedLndGrpc({
  cert: LND_TLS_CERT,
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
const serverStatus: ServerStatus = process.env.LND_MACAROON
  ? ServerStatus.ACTIVE
  : ServerStatus.MOCK;

let sockets: { [id: string]: WebSocket } = {};
let cachedPayments: CachedPayment[] = [];
let pendingContracts: string[] = [];
// ideally this should be stored in a database, but for the sake of simplicity we are using an in-memory cache

console.log(`RPC Provider is running on ${RPC_URL}`);
console.log(`WebSocket server is running on ws://localhost:${PORT || 3003}`);
console.log(`LSP Address: ${signer.address}`);

const serverState: ServerState = {
  lnd,
  htlcContract,
  cachedPayments,
  pendingContracts,
  serverStatus,
};

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  const uuid = uuidv4();
  sockets[uuid] = ws;

  const connectionResponse: ConnectionResponse = {
    serverStatus: serverState.serverStatus,
    uuid,
    message: "Connected to server",
  };

  ws.send(JSON.stringify(connectionResponse));

  ws.on("message", async (message: string) => {
    const request: ClientRequest = JSON.parse(message);

    match(request)
      .with({ kind: KIND.INVOICE_SEND }, async (request) => {
        await processClientInvoiceRequest(request, ws, serverState);
      })
      .with({ kind: KIND.INITIATION }, async (request) => {
        await processClientLightningRecieveRequest(request, ws, serverState);
      })
      .exhaustive();
  });

  ws.on("close", () => console.log("Client disconnected"));
});

// Function to process cached payments
async function processCachedPayments() {
  if (cachedPayments.length === 0) {
    return;
  }
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
