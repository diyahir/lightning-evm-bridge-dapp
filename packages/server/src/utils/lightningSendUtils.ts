import { decode } from "bolt11";
import { ethers } from "ethers";
import { InvoiceRequest } from "shared";
import { providerConfig } from "../provider.config";
import { ContractDetails, ServerState } from "../types/types";
import { pay } from "lightning";
import { getContractDetails, validateLnInvoiceAndContract } from "./validation";
import * as WebSocket from "ws";

export async function processClientInvoiceRequest(
  request: InvoiceRequest,
  ws: WebSocket,
  serverState: ServerState
) {
  if (serverState.pendingContracts.includes(request.contractId)) {
    ws.send(
      JSON.stringify({
        status: "error",
        message: "Contract is already being processed.",
      })
    );
    return;
  }
  serverState.pendingContracts.push(request.contractId);
  try {
    await processInvoiceRequest(request, ws, serverState);
  } catch (error) {
    console.error("Error processing message:", error);
    ws.send(JSON.stringify({ status: "error", message: "Invalid request" }));
  }
  serverState.pendingContracts = serverState.pendingContracts.filter(
    (c) => c !== request.contractId
  );
}

async function processInvoiceRequest(
  request: InvoiceRequest,
  ws: WebSocket,
  serverState: ServerState
) {
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

    const contractExists = await serverState.htlcContract.haveContract(
      request.contractId
    );
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
      serverState.htlcContract
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
    const paymentResponse = await pay({
      lnd: serverState.lnd,
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
    await serverState.htlcContract
      .withdraw(request.contractId, "0x" + paymentResponse.secret, options)
      .then((tx: any) => {
        console.log("Withdrawal Transaction:", tx);
      })
      .catch((error: any) => {
        console.error("Withdrawal Error:", error);
        serverState.cachedPayments.push({
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
