FROM rust:alpine as builder

RUN apk add --no-cache musl-dev git

# Install flicker from source since we can't find the binary URL
RUN cargo install --git https://github.com/DavidHoenisch/flicker --tag v0.1.3

FROM alpine:latest

# Create config directory
RUN mkdir -p /etc/flicker

# Copy binary from builder
COPY --from=builder /usr/local/cargo/bin/flicker /usr/local/bin/flicker

# Copy configuration
COPY flicker.config.yaml /etc/flicker/config.yaml

# Run flicker
CMD ["/usr/local/bin/flicker", "-c", "/etc/flicker/config.yaml"]