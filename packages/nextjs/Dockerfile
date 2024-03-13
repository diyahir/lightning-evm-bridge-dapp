# Base Node.js Image
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV WEBSOCKET_URL="ws://localhost:3003"
# Copy the entire workspace to utilize Docker's cache efficiently and manage dependencies
# Assuming you're still aiming for a structure that involves separate handling for each package,
# and building from the workspace root to include necessary context
COPY package.json yarn.lock ./
COPY packages/nextjs/package.json packages/nextjs/

# Change to the directory of the specific package
WORKDIR /app/packages/nextjs

# Install dependencies for the specific package
RUN yarn install

# Copy the application source code and build the application
COPY packages/nextjs/. .
RUN yarn build

# Production stage
FROM base AS runner
WORKDIR /app

# Corrected the stage name from 'deps' to 'base' since 'deps' stage does not exist
# If you meant to copy from the build stage, you should reference it by its correct name or alias.
COPY --from=base /app/packages/nextjs/.next ./.next
COPY --from=base /app/packages/nextjs/public ./public


# Run the application
CMD ["yarn", "start"]
