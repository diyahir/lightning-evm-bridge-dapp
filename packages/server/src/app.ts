import * as WebSocket from "ws";
import { InvoiceRequest, ContractDetails } from "./types";
import lnService from "ln-service";
import dotenv from "dotenv";
import { ethers } from "ethers";
import deployedContracts from "./contracts/deployedContracts";
import { PaymentRequestObject, decode } from "bolt11";

dotenv.config();

const PORT = process.env.PORT || 3003;
const wss = new WebSocket.Server({ port: Number(PORT) });
const { lnd } = lnService.authenticatedLndGrpc({
  cert: "",
  macaroon: process.env.MACAROON,
  socket: process.env.SOCKET,
});

// Set up Ethereum provider and contract instance
const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const networkId = process.env.CHAIN_ID; // Adjust based on your network; this example uses Hardhat's default network ID
const htlcContractInfo = deployedContracts[networkId]?.HashedTimelock;
const htlcContract = new ethers.Contract(
  htlcContractInfo.address,
  htlcContractInfo.abi,
  signer
);

console.log(`RPC Provider is running on ${process.env.ETH_PROVIDER_URL}`);
console.log(`WebSocket server is running on ws://localhost:${PORT}`);

wss.on("connection", async (ws: WebSocket) => {
  console.log("Client connected");
  ws.send("Server online: You are now connected!");

  ws.on("message", async (message: string) => {
    console.log("Received message: %s", message);

    try {
      const request: InvoiceRequest = JSON.parse(message);
      if (request.contractId && request.lnInvoice) {
        console.log("Invoice Request Received:", request);

        // Check the contract before paying the invoice
        const contractExists = await htlcContract
          .haveContract(request.contractId)
          .then((response) => {
            console.log("Contract Exists:", response);
            return response;
          })
          .catch((error) => {
            console.error("Contract Error:", error);
            ws.send(
              JSON.stringify({
                status: "error",
                message: "Failed to check contract.",
              })
            );
          });

        if (!contractExists) {
          ws.send(
            JSON.stringify({
              status: "error",
              message: "Contract does not exist.",
            })
          );
          return;
        }

        // get ln invoice details
        const lnInvoiceDetails = decode(request.lnInvoice);
        console.log("LN Invoice Details:", lnInvoiceDetails);

        var contractDetails: ContractDetails;
        await htlcContract.getContract(request.contractId).then((response) => {
          contractDetails = {
            sender: response[0],
            receiver: response[1],
            amount: response[2],
            hashlock: response[3],
            timelock: response[4],
            withdrawn: response[5],
            refunded: response[6],
            preimage: response[7],
          };
        });
        console.log("Contract Details:", contractDetails);

        // Validate the invoice and contract
        if (!validateLnInvoiceAndContract(lnInvoiceDetails, contractDetails)) {
          ws.send(
            JSON.stringify({
              status: "error",
              message: "Invalid Invoice or Contract",
            })
          );
          return;
        }
        console.log("Invoice and Contract are valid, proceeding with payment");

        // If the contract exists, proceed with invoice payment
        await lnService
          .pay({ lnd, request: request.lnInvoice })
          .then(async (response) => {
            console.log("Payment Response:", response);

            await htlcContract
              .withdraw(request.contractId, "0x" + response.secret)
              .then((response) => {
                console.log("Withdraw Response:", response);
              })
              .catch((error) => {
                console.error("Withdraw Error:", error);
                ws.send(
                  JSON.stringify({
                    status: "error",
                    message: "Failed to withdraw from contract.",
                  })
                );
              });

            ws.send(
              JSON.stringify({
                status: "success",
                message: "Invoice paid successfully.",
              })
            );
          })
          .catch((error) => {
            console.error("Payment Error:", error);
            ws.send(
              JSON.stringify({
                status: "error",
                message: "Failed to pay invoice.",
              })
            );
          });
      } else {
        ws.send(
          JSON.stringify({
            status: "error",
            message: "Invalid Invoice Request",
          })
        );
      }
    } catch (error) {
      ws.send(JSON.stringify({ status: "error", message: "Invalid JSON" }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

function validateLnInvoiceAndContract(
  lnInvoiceDetails: PaymentRequestObject,
  contractDetails: ContractDetails
) {
  if (lnInvoiceDetails.satoshis < Number(contractDetails.amount)) {
    return false;
  }
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (lnInvoiceDetails.timeExpireDate < currentTimestamp) {
    return false;
  }

  if (Number(contractDetails.timelock) < currentTimestamp) {
    return false;
  }

  if (getPaymentHash(lnInvoiceDetails) !== contractDetails.hashlock) {
    return false;
  }

  if (contractDetails.withdrawn || contractDetails.refunded) {
    return false;
  }

  if (
    contractDetails.preimage !==
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  ) {
    return false;
  }

  return true;
}

function getPaymentHash(
  requestObject: PaymentRequestObject
): `0x${string}` | undefined {
  // go through the tags and find the 'payment_hash' tagName and return the 'data'
  const paymentHash = requestObject.tags.find(
    (tag) => tag.tagName === "payment_hash"
  );
  if (!paymentHash) {
    return undefined;
  }
  return ("0x" + paymentHash.data.toString()) as `0x${string}`;
}
