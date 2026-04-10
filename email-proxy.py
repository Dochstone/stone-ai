import os, smtplib, logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

SMTP_HOST = "smtp.beget.com"
SMTP_PORT = 465
SMTP_EMAIL = "noreply@stoneai.ru"
SMTP_PASSWORD = "u58qbUsva9A@@"
API_KEY = "stoneai-email-secret-2026"

@app.route("/send", methods=["POST"])
def send():
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
