FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY ./frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY ./frontend .

# Create cache directory with proper permissions
RUN mkdir -p node_modules/.cache && chmod -R 777 node_modules/.cache

# Expose port
EXPOSE 3000

# Set environment variable
ENV REACT_APP_API_URL=http://localhost:3001

# Start the application
CMD ["npm", "start"]
