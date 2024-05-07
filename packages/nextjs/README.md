# Next.js Webapp for Lightning EVM Bridge

This webapp is the front-end component of the Lightning EVM Bridge project, designed to interact seamlessly with the blockchain and the Lightning Network. Built with Next.js, it provides a user-friendly interface to initiate and monitor transactions across EVM chains and the Lightning Network through the lightning server.

## Setup

### Requirements

- Node.js (v18 LTS)
- Yarn (v1 or v2+)

### Installation

1. **Clone the repository if you haven't already:**

   ```bash
   git clone https://github.com/diyahir/lightning-dapp.git
   cd lightning-dapp/packages/nextjs
   ```

2. **Install dependencies:**

   ```bash
   yarn install
   ```

### Environment Configuration

1. **Set up the `.env` file:**

   Copy the `sample.env` or `sample.live.env` file depending on your setup preference (local or using pre-configured remote services) and rename it to `.env`. Fill in the necessary environment variables:

## Running Locally

To start the webapp locally, you can run:

```bash
yarn dev
```

This command starts the Next.js development server on [http://localhost:3000](http://localhost:3000). Open your browser to this URL to view and interact with the webapp.

## Building and Running in Production

1. **Build the application:**

   ```bash
   yarn build
   ```

2. **Start the production server:**

   ```bash
   yarn start
   ```

This compiles the application to optimized production code and runs it on the default Next.js production server.
