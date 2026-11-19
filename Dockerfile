FROM node:20-alpine

# Install libc6-compat for native dependency compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies separately
RUN pnpm install

# Copy source code
COPY . .

# Setup build arguments for public variables (needed for Astro build)
# We bake these during build so they reach the client-side JS bundle
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY

ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY

# Build the Astro project
RUN pnpm run build

# Set environment variables for host and port
ENV HOST=0.0.0.0
ENV PORT=4321

# Expose the port
EXPOSE 4321

# Run the backend Node.js entry built by Astro
CMD ["node", "./dist/server/entry.mjs"]
