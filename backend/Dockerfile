FROM ubuntu:20.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js, npm, OpenSSH server, and other dependencies
RUN apt-get update && apt-get install -y \
    curl \
    openssh-server \
    sudo \
    vim \
    && curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure SSH
RUN mkdir /var/run/sshd
RUN echo 'root:technova123' | chpasswd  # VULNERABILITY: Weak root password

# SSH configuration for key-based auth
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Create app user with sudo privileges
RUN useradd -m -s /bin/bash technova && \
    echo 'technova:technova2024' | chpasswd && \
    usermod -aG sudo technova

# Set up SSH for technova user
RUN mkdir -p /home/technova/.ssh && \
    chmod 700 /home/technova/.ssh

# Copy the intentionally exposed SSH key (VULNERABILITY!)
COPY ./ssh-keys/id_rsa.pub /home/technova/.ssh/authorized_keys
RUN chmod 600 /home/technova/.ssh/authorized_keys && \
    chown -R technova:technova /home/technova/.ssh

# Set working directory
WORKDIR /app

# Copy package files
COPY ./backend/package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY ./backend .

# Create startup script
RUN echo '#!/bin/bash\n\
service ssh start\n\
npm start' > /start.sh && \
    chmod +x /start.sh

# Expose ports
EXPOSE 3001 22

# Start SSH and Node.js app
CMD ["/start.sh"]
