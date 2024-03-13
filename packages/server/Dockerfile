# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /packages/server/src/

# Copy package.json and package-lock.json to leverage Docker cache
# to speed up build times when dependencies haven't changed
COPY packages/server/package*.json ./

# Install dependencies
RUN npm install

# If you're using TypeScript, install TypeScript and ts-node globally
RUN npm install -g typescript ts-node

# Copy the current directory contents into the container at /usr/src/app
COPY packages/server/. .


# Make port available to the world outside this container
EXPOSE 3003

# Define environment variables
ENV PORT=3003
ENV NODE_ENV=production

# Add .env file and other necessary files
# Use .dockerignore to exclude files from your container
COPY packages/server/.env .

# Run the app when the container launches
CMD ["ts-node", "src/app.ts"]
