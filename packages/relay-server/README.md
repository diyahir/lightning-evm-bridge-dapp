# Relay Server for Lightning EVM Bridge

The Relay Server is a crucial component of the Lightning EVM Bridge system, handling the automation of Hashed Timelock Contract (HTLC) claims. This server's primary role is to facilitate the secure and timely claiming of HTLCs on behalf of users who might not have the necessary resources (like gas for transaction fees) to do it themselves.

## Overview

The Relay Server monitors blockchain events related to HTLCs and interacts directly with the smart contracts to execute claims. This process is critical for ensuring that the payment channel is reliable and that the participants receive their funds in a timely manner.

## Setup

### Requirements

- Node.js (v18 LTS)
- Yarn (v1 or v2+)
- Access to an Ethereum RPC endpoint

### Installation

1. **Clone the repository if not already done:**

   ```bash
   git clone https://github.com/diyahir/lightning-dapp.git
   cd lightning-dapp/packages/relay-server
   ```

2. **Install dependencies:**

   ```bash
   yarn install
   ```

### Environment Configuration

Create an `.env` file based on the `sample.env` template included in the directory. Update the following keys with appropriate values:

```plaintext
RPC_URL="your_ethereum_rpc_url"
PRIVATE_KEY="your_private_key_for_transaction_signing"
```

## Running the Server

To start the Relay Server, use:

```bash
yarn start
```

This command will initiate the server, which listens for blockchain events and processes HTLC claims automatically.

## Features

- **Automated Claiming**: Automates the process of claiming funds locked in HTLCs, ensuring that users don't lose their funds due to missed deadlines.
- **Monitoring and Notifications**: Monitors blockchain events and can be configured to send notifications upon successful or failed claims.
- **Security Measures**: Implements necessary security measures to manage and use private keys safely for signing transactions without exposing them.

## Future Enhancements

- **Optimization of Gas Usage**: Implement strategies to minimize gas costs when claiming HTLCs.
- **Support for Multiple Chains**: Extend support to multiple EVM-compatible chains to enhance the utility of the service.
- **Enhanced Error Handling**: Develop robust error handling mechanisms to deal with unforeseen network or smart contract errors.
