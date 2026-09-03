import os
import smtplib
import ssl
import socket
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class IPv4SMTP(smtplib.SMTP):
    """SMTP client that forces IPv4 socket resolution to prevent [Errno 101] Network is unreachable on cloud hosts."""
    def _get_socket(self, host, port, timeout):
        try:
            res = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM)
            ip, p = res[0][4][0], res[0][4][1]
            return socket.create_connection((ip, p), timeout)
        except Exception:
            return socket.create_connection((host, port), timeout)

class IPv4SMTP_SSL(smtplib.SMTP_SSL):
    """SMTP_SSL client that forces IPv4 socket resolution to prevent [Errno 101] Network is unreachable on cloud hosts."""
    def _get_socket(self, host, port, timeout):
        try:
            res = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM)
            ip, p = res[0][4][0], res[0][4][1]
            raw_sock = socket.create_connection((ip, p), timeout)
        except Exception:
            raw_sock = socket.create_connection((host, port), timeout)
        server_hostname = self._host if ssl.HAS_SNI else None
        return self.context.wrap_socket(raw_sock, server_hostname=server_hostname)

class EmailService:
    @staticmethod
    def get_smtp_credentials(smtp_override: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Retrieves SMTP credentials from override dict, environment variables, or defaults.
        """
        config = smtp_override or {}
        active_provider = config.get("active_provider") or "brevo"
        user = config.get("user") or os.getenv("SMTP_USER") or os.getenv("GMAIL_USER") or ""
        password = config.get("password") or os.getenv("SMTP_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD") or ""
        host = config.get("host") or os.getenv("SMTP_HOST") or "smtp.gmail.com"
        port = int(config.get("port") or os.getenv("SMTP_PORT") or 587)
        resend_key = config.get("resend_api_key") or os.getenv("RESEND_API_KEY") or ""
        brevo_key = config.get("brevo_api_key") or os.getenv("BREVO_API_KEY") or ""
        brevo_sender = config.get("brevo_sender_email") or os.getenv("BREVO_SENDER_EMAIL") or user or "manav.nagpal2005@gmail.com"
        
        return {
            "active_provider": active_provider,
            "host": host,
            "port": port,
            "user": user.strip(),
            "password": password.strip().replace(" ", ""),  # Gmail App Passwords can have spaces
            "resend_api_key": resend_key.strip() if resend_key else "",
            "brevo_api_key": brevo_key.strip() if brevo_key else "",
            "brevo_sender_email": brevo_sender.strip() if brevo_sender else "manav.nagpal2005@gmail.com"
        }

    @classmethod
    def send_email(cls, to_email: str, subject: str, html_body: str, smtp_override: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Sends an email using the single chosen active_provider (Brevo, Resend, or Gmail).
        """
        creds = cls.get_smtp_credentials(smtp_override)
        provider = creds.get("active_provider", "brevo")
        sender_name = creds.get("sender_name") or "BuyFlow Store"

        # 1. BREVO PROVIDER (Default / Recommended: 300 Free Emails/day to ANY recipient)
        if provider == "brevo":
            brevo_key = creds.get("brevo_api_key") or os.getenv("BREVO_API_KEY")
            sender_email_brevo = creds.get("brevo_sender_email") or creds.get("user") or "manav.nagpal2005@gmail.com"
            if not brevo_key:
                return {
                    "sent": False,
                    "mode": "BREVO_KEY_MISSING",
                    "message": "Brevo API key is not configured. Please paste your Brevo Key in the Email Setup tab."
                }

            # Method 1A: Brevo HTTPS REST API (Port 443) - For xkeysib- API keys
            if not brevo_key.strip().startswith("xsmtpsib-"):
                try:
                    import urllib.request
                    import urllib.error
                    import json
                    payload = json.dumps({
                        "sender": {"name": sender_name, "email": sender_email_brevo},
                        "to": [{"email": to_email}],
                        "subject": subject,
                        "htmlContent": html_body
                    }).encode("utf-8")
                    req_obj = urllib.request.Request(
                        "https://api.brevo.com/v3/smtp/email",
                        data=payload,
                        headers={
                            "api-key": brevo_key.strip(),
                            "accept": "application/json",
                            "content-type": "application/json"
                        }
                    )
                    with urllib.request.urlopen(req_obj, timeout=10) as resp:
                        if resp.status in (200, 201, 202):
                            logger.info(f"[EMAIL DELIVERED] Successfully sent email to {to_email} via Brevo HTTPS")
                            return {
                                "sent": True,
                                "mode": "BREVO_HTTPS",
                                "message": f"Free live email delivered successfully to {to_email} via Brevo!",
                                "to": to_email
                            }
                except urllib.error.HTTPError as e_brevo_http:
                    err_body = e_brevo_http.read().decode('utf-8', errors='ignore')
                    logger.error(f"[BREVO HTTPS HTTP ERROR {e_brevo_http.code}] {err_body}")
                    try:
                        import json
                        parsed_err = json.loads(err_body)
                        err_msg = parsed_err.get("message") or err_body
                    except Exception:
                        err_msg = err_body
                    return {
                        "sent": False,
                        "mode": "BREVO_HTTP_ERROR",
                        "code": e_brevo_http.code,
                        "message": f"Brevo API error ({e_brevo_http.code}): {err_msg}. Note: API Key must start with 'xkeysib-...' from the 'API Keys' tab at https://app.brevo.com/settings/keys/api."
                    }
                except Exception as e_brevo_api:
                    logger.warning(f"Brevo HTTPS attempt returned: {e_brevo_api}")

            # Method 1B: Brevo SMTP Relay on smtp-relay.brevo.com (Port 587 or 465) for xsmtpsib- keys
            smtp_err = ""
            for port in [587, 465]:
                try:
                    brevo_msg = MIMEMultipart("alternative")
                    brevo_msg["Subject"] = subject
                    brevo_msg["From"] = f"{sender_name} <{sender_email_brevo}>"
                    brevo_msg["To"] = to_email
                    brevo_msg.attach(MIMEText(html_body, "html"))

                    if port == 465:
                        b_server = IPv4SMTP_SSL("smtp-relay.brevo.com", 465, timeout=8)
                    else:
                        b_server = IPv4SMTP("smtp-relay.brevo.com", 587, timeout=8)
                        b_server.ehlo()
                        b_server.starttls(context=ssl.create_default_context())
                        b_server.ehlo()

                    b_server.login(sender_email_brevo, brevo_key.strip())
                    b_server.sendmail(sender_email_brevo, [to_email], brevo_msg.as_string())
                    b_server.quit()
                    logger.info(f"[EMAIL DELIVERED] Successfully sent email to {to_email} via Brevo SMTP Relay (Port {port})")
                    return {
                        "sent": True,
                        "mode": "BREVO_SMTP_RELAY",
                        "message": f"Free live email delivered successfully to {to_email} via Brevo SMTP Relay (Port {port})!",
                        "to": to_email
                    }
                except Exception as e_relay:
                    smtp_err = str(e_relay)
                    logger.warning(f"Brevo SMTP Relay on port {port} failed: {e_relay}")

            if brevo_key.strip().startswith("xsmtpsib-"):
                return {
                    "sent": False,
                    "mode": "BREVO_SMTP_KEY_NOTICE",
                    "message": f"You entered a Brevo SMTP key (xsmtpsib-...), but Brevo rejected authentication ({smtp_err}). For 100% guaranteed delivery on cloud hosts, please generate a REST API key (starts with 'xkeysib-...') from Brevo ➔ 'API Keys' tab at https://app.brevo.com/settings/keys/api"
                }

            return {
                "sent": False,
                "mode": "BREVO_ERROR",
                "message": f"Brevo delivery failed: {smtp_err}. Please ensure your API key starts with 'xkeysib-...' from https://app.brevo.com/settings/keys/api"
            }

        # 2. GMAIL SMTP PROVIDER
        elif provider == "gmail":
            if not creds.get("user") or not creds.get("password"):
                return {
                    "sent": False,
                    "mode": "GMAIL_CREDS_MISSING",
                    "message": "Gmail Address or 16-character App Password missing. Please fill in both fields."
                }

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{sender_name} <{creds['user']}>"
            msg["To"] = to_email
            part = MIMEText(html_body, "html")
            msg.attach(part)

            # Try STARTTLS on 587
            try:
                server = smtplib.SMTP(creds["host"], creds["port"], timeout=6)
                server.ehlo()
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
                server.login(creds["user"], creds["password"])
                server.sendmail(creds["user"], [to_email], msg.as_string())
                server.quit()
                logger.info(f"[EMAIL DELIVERED] Successfully sent email to {to_email} via Gmail STARTTLS {creds['port']}")
                return {
                    "sent": True,
                    "mode": "SMTP_DELIVERED",
                    "message": f"Live email delivered successfully to {to_email} via Gmail SMTP!",
                    "to": to_email
                }
            except smtplib.SMTPAuthenticationError as e_auth:
                logger.error(f"[GMAIL AUTH ERROR] {e_auth}")
                return {
                    "sent": False,
                    "mode": "GMAIL_AUTH_FAILED",
                    "error": str(e_auth),
                    "message": "Gmail Authentication Failed: Please ensure 2-Step Verification is ON in your Google Account and generate a 16-character App Password at https://myaccount.google.com/apppasswords"
                }
            except Exception as e_starttls:
                logger.warning(f"Gmail STARTTLS 587 failed: {e_starttls}. Trying SSL 465...")

            # Try SSL on 465
            try:
                ssl_ctx = ssl.create_default_context()
                server = smtplib.SMTP_SSL(creds["host"], 465, timeout=6, context=ssl_ctx)
                server.ehlo()
                server.login(creds["user"], creds["password"])
                server.sendmail(creds["user"], [to_email], msg.as_string())
                server.quit()
                logger.info(f"[EMAIL DELIVERED] Successfully sent email to {to_email} via Gmail SSL 465")
                return {
                    "sent": True,
                    "mode": "SMTP_DELIVERED",
                    "message": f"Live email delivered successfully to {to_email} via Gmail SMTP SSL!",
                    "to": to_email
                }
            except smtplib.SMTPAuthenticationError as e_auth_ssl:
                logger.error(f"[GMAIL AUTH ERROR SSL] {e_auth_ssl}")
                return {
                    "sent": False,
                    "mode": "GMAIL_AUTH_FAILED",
                    "error": str(e_auth_ssl),
                    "message": "Gmail Authentication Failed: Please generate a 16-character App Password at https://myaccount.google.com/apppasswords"
                }
            except Exception as e_ssl:
                return {
                    "sent": False,
                    "mode": "GMAIL_ERROR",
                    "message": f"Gmail delivery failed: {e_ssl}. If running on cloud free-tier, please use Brevo (300 free emails/day) for 100% reliable port 443 delivery."
                }

        # 3. RESEND HTTPS PROVIDER
        elif provider == "resend":
            resend_key = creds.get("resend_api_key") or os.getenv("RESEND_API_KEY")
            sender_email = creds.get("from_email") or os.getenv("RESEND_FROM_EMAIL") or "onboarding@resend.dev"
            if not resend_key:
                return {
                    "sent": False,
                    "mode": "RESEND_KEY_MISSING",
                    "message": "Resend API key is not configured. Please paste your Resend API Key."
                }
            try:
                import urllib.request
                import json
                payload = json.dumps({
                    "from": f"{sender_name} <{sender_email}>",
                    "to": [to_email],
                    "subject": subject,
                    "html": html_body
                }).encode("utf-8")
                req_obj = urllib.request.Request(
                    "https://api.resend.com/emails",
                    data=payload,
                    headers={
                        "Authorization": f"Bearer {resend_key.strip()}",
                        "Content-Type": "application/json",
                        "User-Agent": "resend-python/2.0.0"
                    }
                )
                with urllib.request.urlopen(req_obj, timeout=10) as resp:
                    if resp.status in (200, 201):
                        logger.info(f"[EMAIL DELIVERED] Successfully sent email to {to_email} via Resend HTTPS")
                        return {
                            "sent": True,
                            "mode": "RESEND_HTTPS",
                            "message": f"Live email delivered successfully to {to_email} via Resend HTTPS!",
                            "to": to_email
                        }
            except urllib.error.HTTPError as e_http:
                err_content = e_http.read().decode('utf-8', errors='ignore')
                return {
                    "sent": False,
                    "mode": "RESEND_ERROR",
                    "message": f"Resend error: {err_content}"
                }
            except Exception as e_resend:
                return {
                    "sent": False,
                    "mode": "RESEND_ERROR",
                    "message": f"Resend failed: {e_resend}"
                }

        return {
            "sent": False,
            "mode": "SIMULATION_LOGGED",
            "message": "No email delivery provider selected. Please select Brevo, Resend, or Gmail in your dashboard."
        }

    @classmethod
    def send_otp_email(cls, to_email: str, otp_code: str, store_name: str = "BuyFlow Store", smtp_override: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Sends formatted OTP verification email with prominent Store Branding.
        """
        subject = f"{otp_code} is your {store_name} Verification Code"
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; }}
            .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; text-align: center; }}
            .store-badge {{ display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 20px; border: 1px solid #dbeafe; }}
            .title {{ font-size: 24px; font-weight: 900; color: #0f172a; margin: 0 0 12px; letter-spacing: -0.5px; }}
            .desc {{ font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px; }}
            .otp-box {{ font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8; background: #f8fafc; border-radius: 16px; padding: 18px 24px; margin: 24px 0; border: 2px dashed #93c5fd; font-family: monospace; }}
            .expiry {{ font-size: 12px; color: #94a3b8; margin: 0 0 24px; font-weight: 500; }}
            .footer {{ font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="store-badge">🛍️ {store_name}</div>
            <h1 class="title">Your Verification Code</h1>
            <p class="desc">
              Please enter the 6-digit code below to verify your account and start shopping with our AI concierge at <strong>{store_name}</strong>.
            </p>
            <div class="otp-box">{otp_code}</div>
            <p class="expiry">🔒 Valid for 10 minutes • Keep this code private.</p>
            <div class="footer">
              Powered by <strong>BuyFlow AI Commerce OS</strong> • Secure In-Chat Checkout
            </div>
          </div>
        </body>
        </html>
        """
        return cls.send_email(to_email, subject, html_body, smtp_override)

    @classmethod
    def send_order_confirmation_email(cls, to_email: str, order_id: str, amount: float, tracking_number: str, store_name: str = "Razorpay AI Storefront", smtp_override: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Sends formatted Order Confirmation & Receipt email.
        """
        subject = f"Order Confirmed: #{order_id[:8]} - {store_name}"
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; }}
            .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; }}
            .header {{ color: #16a34a; font-size: 22px; font-weight: 800; margin-bottom: 8px; }}
            .receipt-box {{ background: #f8fafc; border-radius: 12px; padding: 18px; margin: 20px 0; border: 1px solid #e2e8f0; }}
            .row {{ display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">✓ Payment Successful</div>
            <p style="color: #475569; font-size: 14px;">Thank you for your purchase from <strong>{store_name}</strong>. Your order is confirmed and being prepared for shipment.</p>
            
            <div class="receipt-box">
              <div style="font-weight: bold; margin-bottom: 12px; color: #0f172a;">Order Summary</div>
              <div style="color: #64748b; font-size: 13px; margin-bottom: 4px;">Order ID: <strong>#{order_id}</strong></div>
              <div style="color: #64748b; font-size: 13px; margin-bottom: 4px;">Total Amount: <strong style="color: #16a34a;">₹{amount:,.2f} INR</strong></div>
              <div style="color: #64748b; font-size: 13px;">Tracking AWB: <strong style="color: #4f46e5;">{tracking_number} (BlueDart Air)</strong></div>
            </div>

            <p style="color: #64748b; font-size: 13px;">You can track your shipment anytime by entering your email in the AI Shopping Assistant.</p>
          </div>
        </body>
        </html>
        """
        return cls.send_email(to_email, subject, html_body, smtp_override)