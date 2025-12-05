import logging
import os
from flask import Flask

app = Flask(__name__)

# Setup logging to shared volume
log_dir = "/var/log/shared"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

log_file = os.path.join(log_dir, "frontend.log")

logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

@app.route('/')
def home():
    app.logger.info("Frontend Home page accessed")
    return "<h1>Frontend Service</h1><p>Logging to shared volume...</p>"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
