import { describe, test, expect } from "@jest/globals";
import { providerConfig } from "../provider.config";
import {
  validateLnInvoiceAndContract,
  getPaymentHash,
  getContractAmountFromInvoice,
} from "../utils/validation";
import { PaymentRequestObject } from "bolt11";
import { ContractDetails } from "../types/types";

describe("validateLnInvoiceAndContract", () => {
  const mockCurrentTime = 1700000000; // Mock current timestamp
  beforeAll(() => {
    // Mock Date.now to return a fixed timestamp
    jest
      .spyOn(global.Date, "now")
      .mockImplementation(() => mockCurrentTime * 1000);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("should return false if invoice amount is greater than the contract amount", () => {
    const paymentRequest: PaymentRequestObject = {
      satoshis: 40,
      tags: [{ tagName: "payment_hash", data: "abc123" }],
    };
    const contractDetails: ContractDetails = {
      amount: BigInt(38),
      hashlock: "0xabc123",
      timelock: BigInt(mockCurrentTime + 3000),
      sender: "sender",
      receiver: "receiver",
      withdrawn: false,
      refunded: false,
      preimage:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    };
    const result = validateLnInvoiceAndContract(
      paymentRequest,
      contractDetails
    );
    expect(result.isValid).toBe(false);
    expect(result.message).toBe(
      "Invoice amount is greater than contract amount"
    );
  });

  test("should return false if invoice amount exceeds max allowed satoshis", () => {
    const paymentRequest: PaymentRequestObject = {
      satoshis: 1000,
      tags: [{ tagName: "payment_hash", data: "abc123" }],
    };
    const contractDetails: ContractDetails = {
      amount: BigInt("1000"),
      hashlock: "0xabc123",
      timelock: BigInt(mockCurrentTime + 3000),
      sender: "sender",
      receiver: "receiver",
      withdrawn: false,
      refunded: false,
      preimage:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    };
    const result = validateLnInvoiceAndContract(
      paymentRequest,
      contractDetails
    );
    expect(result.isValid).toBe(false);
    expect(result.message).toBe(
      `Invoice amount is higher than ${providerConfig.maxSats} satoshis ;(`
    );
  });
});

describe("getPaymentHash", () => {
  test("should return the correct payment hash", () => {
    const requestObject = {
      tags: [{ tagName: "payment_hash", data: "abc123" }],
    };
    const hash = getPaymentHash(requestObject);
    expect(hash).toBe("0xabc123");
  });

  test("should return undefined if payment_hash tag is missing", () => {
    const requestObject = { tags: [] };
    const hash = getPaymentHash(requestObject);
    expect(hash).toBeUndefined();
  });
});

describe("getContractAmountFromInvoice", () => {
  test("should calculate the correct amount including fees", () => {
    const satsInInvoice = 1000;
    const expected =
      satsInInvoice * (1 + providerConfig.basisPointFee / 10000) +
      providerConfig.baseFee;
    const calculated = getContractAmountFromInvoice(satsInInvoice);
    expect(calculated).toBe(expected);
  });
});
