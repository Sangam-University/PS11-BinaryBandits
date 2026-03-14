FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy root package files for workspace resolution
COPY package.json package-lock.json ./

# Copy backend package.json
COPY backend/package.json ./backend/

# Create a dummy frontend package.json so npm workspaces doesn't complain
RUN mkdir -p frontend && echo '{"name":"frontend","version":"1.0.0","private":true}' > frontend/package.json

# Install all dependencies (including devDependencies for prisma, tsx, typescript)
RUN npm install

# Copy Prisma schema and migrations
COPY backend/prisma ./backend/prisma

# Generate Prisma client (run from backend dir so npx finds the local prisma binary)
WORKDIR /app/backend
RUN npx prisma generate

# Copy backend source
WORKDIR /app
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/

EXPOSE 5000

# Run migrations then start server
WORKDIR /app/backend
CMD npx prisma migrate deploy && npx tsx src/server.ts
