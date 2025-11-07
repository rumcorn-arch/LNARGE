FROM node:24.11.0-bullseye-slim

# Install system deps commonly required for native modules (sharp, etc.)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    git \
    ca-certificates \
    gcc \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libvips-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only package files first to leverage Docker cache for npm install
COPY package*.json ./

# Use npm to install dependencies. --legacy-peer-deps helps with peer conflicts in some projects.
RUN npm install --legacy-peer-deps

# Copy the rest of the source
COPY . .

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

# Start Next.js dev server and bind to 0.0.0.0 so host can access it
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
