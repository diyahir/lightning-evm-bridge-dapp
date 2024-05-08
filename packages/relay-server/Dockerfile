# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy relevant files from the root to handle Yarn workspaces
COPY package.json yarn.lock ./

# Copy local dependency directly if it's part of your workspace
COPY packages/shared /app/packages/shared

# Copy the package.json from the relay-server package
COPY packages/relay-server/package.json /app/packages/relay-server/

# Install dependencies using yarn
# Use --frozen-lockfile to ensure reproducible installs
# Ensure the workspace is properly set up to handle local dependencies
# Environment variable to skip Husky install
ENV HUSKY_SKIP_INSTALL=1
RUN npm install

# If you're using TypeScript, install TypeScript and ts-node globally
RUN npm install -g typescript ts-node

# Copy the rest of the application source code from the relay-server package
COPY packages/relay-server/ /app/packages/relay-server/

# Build the application if TypeScript or other build steps are necessary
# Assuming build scripts are configured in package.json
RUN cd packages/relay-server && npm build

# Make port 3004 available to the world outside this container
EXPOSE 3004

# Set environment variables
ENV PORT=3004
ENV NODE_ENV=production

# Optionally, if you still need to use the .env file:
COPY packages/relay-server/.env .

# Run the app when the container launches
CMD ["ts-node", "packages/relay-server/src/app.ts"]