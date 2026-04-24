FROM node:24-slim

# Install Python + pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Install clinical Python libraries
RUN pip3 install drugdose vitalscore --break-system-packages

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app
COPY . .

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @workspace/api-server run build

CMD ["node", "artifacts/api-server/dist/index.mjs"]
