# Build Caddy with Coraza WAF plugin
FROM caddy:builder AS builder

# Install xcaddy and build Caddy with Coraza plugin
RUN xcaddy build \
    --with github.com/corazawaf/coraza-caddy/v2 \
    --with github.com/mholt/caddy-l4 \
    --with github.com/mholt/caddy-l4/modules/l4ssh

# Final image
FROM caddy:latest

# Copy the custom-built Caddy binary with Coraza
COPY --from=builder /usr/bin/caddy /usr/bin/caddy

# Copy Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# VULNERABILITY: DetectionOnly mode - logs attacks but doesn't block
# This demonstrates security theater in action
