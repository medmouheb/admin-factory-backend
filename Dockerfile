# Use Node.js 22 to match your local environment
FROM node:22

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the API port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]
