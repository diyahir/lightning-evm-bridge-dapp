# Lightning Server

The Lightning Server acts as the bridge between Ethereum Virtual Machine (EVM) chains and the Lightning Network, facilitating secure and trust-minimized payments. This server interacts with the providers's Lightning node to facilitate payments based on HTLC (Hashed Time-Locked Contracts) states communicated via smart contracts.

## Overview

The Lightning Server connects to a configured Lightning node and acts as a payment relay between the node and the Ethereum blockchain. It verifies the authenticity of payment requests and ensures that only valid and confirmed transactions trigger the corresponding actions on the Lightning Network.

## Setup

### Installation

1. **Install dependencies:**

   ```bash
   yarn install
   ```

2. **Environment Setup:**

   Copy the `sample.env` file to `.env` and update the environment variables according to your setup:

   ```bash
    cp sample.env .env
   ```

   ```plaintext
   LND_MACAROON=path_to_macaroon
   LND_SOCKET=your_lightning_node_socket
   ```

### Running the Server

- **With Docker:**

  ```bash
  docker-compose up --build
  ```

- **Manually:**

  ```bash
  yarn start
  ```

  This will start the server locally on the configured port, connecting to your specified Lightning node.

## Configuration

Ensure that the `.env` file is configured correctly. Key configurations include:

- **`LND_MACAROON`**: Path to your macaroon file for authenticating with your Lightning node.
- **`LND_SOCKET`**: The address and port of your Lightning node's API.

## Features

- **Payment Verification**: Checks the validity of HTLC-based payment requests.
- **Invoice Payment**: Pays Lightning Network invoices if the associated blockchain transaction is verified.
- **Preimage Handling**: Retrieves payment preimages from the Lightning Network and communicates them back to the smart contract on the EVM chain.

## Mock Mode

To run the server in mock mode, set the Lightning configurations in the `.env` file to empty. This mode simulates Lightning Network operations and can be used for testing:

```plaintext
LND_MACAROON=""
LND_SOCKET=""
```

## Production Deployment

For production, make sure to secure your server, especially the API keys and macaroon files. Use Docker for easy and consistent deployments. Configure SSL/TLS if accessible over the Internet.
