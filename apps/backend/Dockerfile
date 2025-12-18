FROM node:22-bookworm

RUN apt-get update && apt-get install -y bash

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build || (echo "Build failed" && exit 1)
RUN ls -la dist/ && ls -la dist/src/ || echo "dist/src not found"

# Install production dependencies and keep env-cmd for scripts
RUN npm install --production --ignore-scripts && npm install env-cmd

COPY ./wait-for-it.sh /opt/wait-for-it.sh
COPY ./startup.relational.dev.sh /opt/startup.relational.dev.sh
RUN chmod +x /opt/*.sh && sed -i 's/\r//g' /opt/*.sh

CMD ["/opt/startup.relational.dev.sh"]
