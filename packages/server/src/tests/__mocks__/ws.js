// __mocks__/ws.js or directly in your test file

jest.mock('ws', () => {
  const mWebSocket = {
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
    terminate: jest.fn(),
    default: class {
      constructor(url) {
        this.url = url;
        this.readyState = 1;
      }
    }
  };
  return {
    WebSocket: jest.fn().mockImplementation(() => mWebSocket),
  };
});
