# Use the official Node.js active LTS image
FROM node:20-slim

# Create and define the working directory
WORKDIR /app

# Copy package files first to leverage Docker build cache
COPY package*.json ./

# Install dependencies (both dev and prod dependencies are needed for the build step)
RUN npm install

# Copy all source files
COPY . .

# Build the Vite React frontend (generates /dist directory)
RUN npm run build

# Prune devDependencies to keep the image slim
RUN npm prune --production

# Expose port 8080 (Cloud Run defaults to routing traffic to 8080)
ENV PORT=8080
EXPOSE 8080

# Start the Express server
CMD ["npm", "start"]
