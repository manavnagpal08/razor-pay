import os
import json
import firebase_admin
from firebase_admin import credentials
import logging

logger = logging.getLogger(__name__)

def init_firebase():
    """Initializes the Firebase Admin SDK for both local and cloud environments."""
    if not firebase_admin._apps:
        raw_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if raw_json:
            try:
                cert_dict = json.loads(raw_json)
                cred = credentials.Certificate(cert_dict)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT_JSON env var.")
                return
            except Exception as e:
                logger.error(f"Failed to initialize Firebase from raw JSON: {e}")

        # Check file locations
        cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY", "serviceAccountKey.json")
        possible_paths = [
            cred_path,
            os.path.join(os.path.dirname(__file__), "..", "serviceAccountKey.json"),
            os.path.join(os.getcwd(), "backend", "serviceAccountKey.json"),
            os.path.join(os.getcwd(), "serviceAccountKey.json")
        ]

        for path in possible_paths:
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8-sig") as f:
                        cert_dict = json.load(f)
                    cred = credentials.Certificate(cert_dict)
                    firebase_admin.initialize_app(cred)
                    logger.info(f"Firebase Admin SDK initialized successfully from {path}.")
                    return
                except Exception as e:
                    logger.error(f"Failed to initialize Firebase Admin SDK from {path}: {e}")

        logger.warning("Firebase credentials not found. Ensure serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT_JSON is set.")
