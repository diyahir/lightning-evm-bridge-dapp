// __mocks__/lightning.js
module.exports = {
  createInvoice: jest.fn(({ lnd, tokens }) => {
    console.log("lnd", lnd);
    Promise.resolve({
      request: "invoiceRequest", // Ensure this is correctly structured
      id: "invoiceId",
    });
  }),
  subscribeToInvoice: jest.fn(() => ({
    on: jest.fn((event, handler) => {
      if (event === "invoice_updated") {
        // Simulate an invoice update
        process.nextTick(() => handler({ is_confirmed: true }));
      }
    }),
    removeAllListeners: jest.fn(),
  })),
  cancelHodlInvoice: jest.fn(),
  createHodlInvoice: jest.fn(),
  settleHodlInvoice: jest.fn(),
};
