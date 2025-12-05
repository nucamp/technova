import logging
import os
from flask import Flask, request, jsonify

app = Flask(__name__)

# Setup logging to shared volume
log_dir = "/var/log/shared"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

log_file = os.path.join(log_dir, "app.log")

# Configure logging
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

@app.route('/')
def home():
    app.logger.info("Home page accessed")
    return "Welcome to the Vulnerable App!"

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    # INDUSTRY ACCEPTED: Logging the attempt
    app.logger.info(f"Login attempt for user: {username}")
    
    # VULNERABILITY: Logging the password in plain text!
    # This is for educational purposes to demonstrate what NOT to do.
    app.logger.info(f"User {username} provided password: {password}")
    
    if username == "admin" and password == "secret":
        return jsonify({"status": "success", "token": "12345-ADMIN-TOKEN"})
    else:
        return jsonify({"status": "failure"}), 401

@app.route('/user/<user_id>')
def get_user(user_id):
    # INDUSTRY ACCEPTED: Logging the resource access
    app.logger.info(f"Fetching data for user_id: {user_id}")
    
    # Simulate sensitive data retrieval
    user_data = {
        "id": user_id,
        "name": "John Doe",
        "ssn": "123-45-6789",
        "credit_card": "4111-1111-1111-1111"
    }
    
    # VULNERABILITY: Logging PII (Personally Identifiable Information)
    app.logger.info(f"Retrieved user data: {user_data}")
    
    return jsonify(user_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001)
