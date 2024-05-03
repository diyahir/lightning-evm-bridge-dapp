import { ethers } from "ethers";
import {
  InitiationRequest,
  InitiationResponse,
  HodlInvoiceResponse,
  GWEIPERSAT,
  KIND,
  HodlInvoiceContractResponse,
} from "shared";
import { ServerState } from "../types/types";
import * as WebSocket from "ws";
import {
  cancelHodlInvoice,
  createHodlInvoice,
  createInvoice,
  settleHodlInvoice,
  subscribeToInvoice,
} from "lightning";
import { getContractDetails } from "./validation";

// Step 1: User sends initiation request and pays the initiation invoice
export async function processClientLightningRecieveRequest(
  request: InitiationRequest,
  ws: WebSocket,
  serverState: ServerState
) {
  try {
    // get client user id
    const invoice = await createInvoice({
      lnd: serverState.lnd,
      tokens: 10,
    });

    const intiationResponse: InitiationResponse = {
      lnInvoice: invoice.request,
    };

    const sub = subscribeToInvoice({
      lnd: serverState.lnd,
      id: invoice.id,
    });

    console.log("Subscribing to invoice updates");

    sub.on("invoice_updated", async (invoice) => {
      onInitiationInvoicePaidCallback(invoice, ws, sub, request, serverState);
    });

    ws.send(JSON.stringify(intiationResponse));
  } catch (error) {
    console.error("Error creating invoice:", error);
    ws.send(
      JSON.stringify({ status: "error", message: "Failed to create invoice." })
    );
  }
}

// Step 2: After the initiation invoice is paid
// a hodl invoice with the client's hashlock is created
async function onInitiationInvoicePaidCallback(
  invoice: any,
  ws: WebSocket,
  prevSub: any,
  request: InitiationRequest,
  serverState: ServerState
) {
  if (invoice.is_confirmed) {
    prevSub.removeAllListeners();
    console.log("Invoice Confirmed");

    const now = Math.floor(Date.now() / 1000);
    const expiryTime = now + 600;

    const sub = subscribeToInvoice({
      lnd: serverState.lnd,
      id: request.hashlock,
    });

    const hodlInvoice = await createHodlInvoice({
      lnd: serverState.lnd,
      id: request.hashlock,
      tokens: request.amount,
      expires_at: expiryTime.toString(),
    });

    console.log("Hodl Invoice Created:", hodlInvoice);

    console.log("Subscribing to hodl invoice updates");
    sub.on("invoice_updated", async (invoice) => {
      console.log("Hodl Invoice Updated:", invoice);
      if (invoice.is_held) {
        console.log("Hodl Invoice Confirmed:", invoice);
        processPaidHodlInvoice(
          request,
          serverState,
          expiryTime,
          hodlInvoice.id,
          ws
        );
        sub.removeAllListeners();
      }
    });

    const hodlInvoiceRes: HodlInvoiceResponse = {
      kind: KIND.HODL_RES,
      lnInvoice: hodlInvoice.request,
    };

    console.log("Sending hodl invoice to client", hodlInvoiceRes);
    ws.send(JSON.stringify(hodlInvoiceRes));
  }
}

// Step 3: User pays the hodl invoice to claim the contract
// Once the hodl invoice is paid, scan the blockchain for the preimage
// settle the invoice via the lnd api
async function processPaidHodlInvoice(
  request: InitiationRequest,
  serverState: ServerState,
  expiryTime: number,
  id: string,
  ws: WebSocket
) {
  const options = {
    gasPrice: ethers.parseUnits("0.001", "gwei"),
    value: BigInt(request.amount * GWEIPERSAT),
  };

  var contractId: string | undefined = undefined;

  console.log("Creating on-chain contract");

  await serverState.htlcContract
    .newContract(
      request.recipient,
      "0x" + request.hashlock,
      BigInt(expiryTime),
      options
    )
    .then(async (tx: any) => {
      await tx.wait().then(async (res) => {
        console.log("Contract Logs:", res.logs[0].args[0]);
        contractId = res.logs[0].args[0];
        const hodlInvoiceContractResponse: HodlInvoiceContractResponse = {
          kind: KIND.HODL_CONTRACT_RES,
          contractId,
        };
        ws.send(JSON.stringify(hodlInvoiceContractResponse));
      });
    })
    .catch((error: any) => {
      console.error("Contract Error:", error);
      ws.send(
        JSON.stringify({
          status: "error",
          message: "Failed to create contract.",
        })
      );
      return;
    });
  console.log("Processing paid hodl invoice");

  while (true && contractId) {
    console.log("Checking hodl invoice status");
    try {
      const now = Math.floor(Date.now() / 1000);
      if (now > expiryTime) {
        console.log("Expiry time reached, cancelling hodl invoice");
        const res = await cancelHodlInvoice({
          lnd: serverState.lnd,
          id,
        });
        console.log("Hodl Invoice Cancelled:", res);
        return;
      }

      const contractDetails = await getContractDetails(
        contractId,
        serverState.htlcContract
      );
      console.log("Contract Details:", contractDetails);
      if (contractDetails.withdrawn) {
        console.log("Preimage found, settling hodl invoice");
        const res = await settleHodlInvoice({
          lnd: serverState.lnd,
          secret: contractDetails.preimage.substring(2),
        });
        console.log("Hodl Invoice Settled:", res);
        return;
      }
    } catch (error) {
      console.error("Error processing hodl invoice:", error);
    }
    // wait for 5 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
