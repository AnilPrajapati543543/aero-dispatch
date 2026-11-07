"""AWS Elastic Beanstalk entry point for AeroDispatch FastAPI.

Elastic Beanstalk Python runtime loads 'application' from 'application.py' by default.
"""
import os

# Load .env variables into environment if present
env_file = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_file):
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                if k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip()

from src.main import app as application

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("application:application", host="0.0.0.0", port=8000, reload=False)
