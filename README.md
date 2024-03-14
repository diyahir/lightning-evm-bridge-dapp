# Lightning EVM Bridge

This is a project to create a bridge between EVM chains and the Lightning Network. The goal is to allow for the creation of smart contracts that can make trust minimized payments to the Lightning Network. This really only makes sense in the context of chains using Bitcoin as their native currency, but it could be extended to other chains as well.

⚙️ Built using NextJS, RainbowKit, Hardhat, Wagmi, Viem, and Typescript, and LND.

## Contents

- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Deploying your Smart Contracts to a Live Network](#deploying-your-smart-contracts-to-a-live-network)

## Project Structure

There are three main parts to this project:

<!-- Make a table with links to each folder -->

| Folder                                | Description                                                       |
| ------------------------------------- | ----------------------------------------------------------------- |
| [Contracts](./packages/foundry)       | This is where the smart contracts live.                           |
| [Frontend](./packages/nextjs)         | This is the frontend of the app.                                  |
| [Lightning server](./packages/server) | This is the lightning service provider who is paying the invoices |

## Requirements

Before you begin, you need to install the following tools:

- [Node (v18 LTS)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Getting Started

**Disclaimer: this is using real lightning network sats because it is just easier and more stable to do so. Do not put more than you are willing to lose.**

#### Lightning Setup

1. You must have a lightning node running. I am using voltage which has a 20 day free trial to host your own node: [Voltage](https://voltage.cloud/).

2. Back up your seed and store it in a safe place.

3. Fund your node with some sats and fund your channel. I recommend opening a channel with someone well connected because it has higher chances of payment success.

#### Running Locally

3. Clone this repo & install dependencies

```
git clone https://github.com/diyahir/lightning-dapp.git
cd lightning-dapp
yarn install
```

2. Copy the `sample.env` file in the root of the project and add the following and change for all 3 packages.

3. Start the services

```
docker-compose up -d --build
```

or using docker build and run the images separately

```
docker build -f packages/nextjs/Dockerfile . -t botanix-ln-webapp
docker build -f packages/server/Dockerfile . -t botanix-ln-server
```

Alternatively: 3. Run a local LSP in the first terminal:

```
cd packages/server
yarn start
```

4. Run a local webapp in a second terminal

```
yarn start
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `hardhat.config.ts`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the contract component or the example ui in the frontend. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

## Deploying your Smart Contracts to a Live Network

Once you are ready to deploy your smart contracts, there are a few things you need to adjust.

1. Select the network

By default, `yarn deploy` will deploy the contract to the local network. You can change the defaultNetwork in `packages/hardhat/hardhat.config.ts.` You could also simply run `yarn deploy --network target_network` to deploy to another network.

Check the `hardhat.config.ts` for the networks that are pre-configured. You can also add other network settings to the `hardhat.config.ts file`. Here are the [Alchemy docs](https://docs.alchemy.com/docs/how-to-add-alchemy-rpc-endpoints-to-metamask) for information on specific networks.

Example: To deploy the contract to the Sepolia network, run the command below:

```
yarn deploy --network sepolia
```

2. Generate a new account or add one to deploy the contract(s) from. Additionally you will need to add your Alchemy API key. Rename `.env.example` to `.env` and fill the required keys.

```
ALCHEMY_API_KEY="",
DEPLOYER_PRIVATE_KEY=""
```

The deployer account is the account that will deploy your contracts. Additionally, the deployer account will be used to execute any function calls that are part of your deployment script.

You can generate a random account / private key with `yarn generate` or add the private key of your crypto wallet. `yarn generate` will create a random account and add the DEPLOYER_PRIVATE_KEY to the .env file. You can check the generated account with `yarn account`.

3. Deploy your smart contract(s)

Run the command below to deploy the smart contract to the target network. Make sure to have some funds in your deployer account to pay for the transaction.

```
cd packages/foundry
yarn deployWithGasPrice --network botanixTestnet
```

4. Verify your smart contract

You can verify your smart contract on Etherscan by running:

```
yarn verify --network network_name
```

eg: `yarn verify --network sepolia`

This uses [etherscan-verify from hardhat-deploy](https://www.npmjs.com/package/hardhat-deploy#4-hardhat-etherscan-verify) to verify all the deployed contracts.

You can alternatively use [hardhat-verify](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify) to verify your contracts, passing network name, contract address and constructor arguments (if any): `yarn hardhat-verify --network network_name contract_address "Constructor arg 1"`

If the chain you're using is not supported by any of the verifying methods, you can add new supported chains to your chosen method, either [etherscan-verify](https://www.npmjs.com/package/hardhat-deploy#options-2) or [hardhat-verify](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify#adding-support-for-other-networks).

**Make sure your `packages/nextjs/scaffold.config.ts` file has the values you need.**

### Future Work

- [ ] Server funds rebalancing (cycle funds from the evm chain to the lightning network channel)
- [ ] ERC20 support for tBTC on other chains (Base, Arbitrum, etc.)
- [ ] Make server multi-chain
- [ ] Add support to receive payments from the lightning network to the evm chain
- [ ] Create proper database for the server
- [ ] Add ability to change LSP
- [ ] Integrate service fee for the LSP
- [ ] Preconfirmations from the LSP before user pays on-chain
- [ ] Indexing payments to provide most recent history

### Disabling Github Workflow

We have github workflow setup checkout `.github/workflows/lint.yaml` which runs types and lint error checks every time code is **pushed** to `main` branch or **pull request** is made to `main` branch

To disable it, **delete `.github` directory**

## Contributing

We welcome contributions to the lightning dapp.

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to the lightning dapp.
