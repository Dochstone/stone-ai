import os, smtplib, logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

BACKEND_ENV_PATH = os.getenv("BACKEND_ENV_PATH", "/var/www/stone-ai/backend/.env")
if os.path.isfile(BACKEND_ENV_PATH):
    with open(BACKEND_ENV_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.beget.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "noreply@stoneai.ru")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
API_KEY = os.getenv("EMAIL_PROXY_KEY", "")

@app.route("/send", methods=["POST"])
def send():
    if not API_KEY or not SMTP_PASSWORD:
        return jsonify({"error": "email proxy is not configured"}), 503
    if request.headers.get("X-API-Key") != API_KEY:
        return jsonify({"error": "unauthorized"}), 401
    data = request.json
    to = data.get("to")
    subject = data.get("subject")
    html = data.get("html")
    if not all([to, subject, html]):
        return jsonify({"error": "missing fields"}), 400
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"Stone AI <{SMTP_EMAIL}>"
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(html, "html", "utf-8"))
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10) as s:
            s.login(SMTP_EMAIL, SMTP_PASSWORD)
            s.send_message(msg)
        app.logger.info(f"Email sent to {to}")
        return jsonify({"status": "ok"})
    except Exception as e:
        app.logger.error(f"SMTP error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)
