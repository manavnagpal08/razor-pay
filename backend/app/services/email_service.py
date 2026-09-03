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
        user = config.get("user") or os.getenv("SMTP_USER") or os.getenv("GMAIL_USER") or ""
        password = config.get("password") or os.getenv("SMTP_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD") or ""
        host = config.get("host") or os.getenv("SMTP_HOST") or "smtp.gmail.com"
        port = int(config.get("port") or os.getenv("SMTP_PORT") or 587)
        resend_key = config.get("resend_api_key") or os.getenv("RESEND_API_KEY") or "re_MaZdzZ2m_L5hmnmmdvKf4UqqN2aanZaNg"
        
        return {
            "host": host,
            "port": port,
            "user": user.strip(),
            "password": password.strip().replace(" ", ""),  # Gmail App Passwords can have spaces
            "resend_api_key": resend_key.strip() if resend_key else ""
        }

    @classmethod
    def send_email(cls, to_email: str, subject: str, html_body: str, smtp_override: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Sends an email using Resend HTTPS (port 443) or IPv4-forced SMTP with auto-fallback between STARTTLS (587) and SSL (465).
        """
        creds = cls.get_smtp_credentials(smtp_override)

        # Strategy 0: HTTPS Email Delivery over port 443 (Allowed on Render free-tier, 100% reliable)
        resend_key = creds.get("resend_api_key") or os.getenv("RESEND_API_KEY") or "re_MaZdzZ2m_L5hmnmmdvKf4UqqN2aanZaNg"
        if resend_key:
            try:
                import urllib.request
                import json
                payload = json.dumps({
                    "from": "BuyFlow <onboarding@resend.dev>",
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
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) BuyFlow/1.0"
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
            except Exception as e_resend:
                logger.warning(f"Resend HTTPS failed: {e_resend}. Falling back to standard SMTP...")

        if not creds["user"] or not creds["password"]:
            logger.info(f"[EMAIL SIMULATION] To: {to_email} | Subject: {subject}")
            return {
                "sent": False,
                "mode": "SIMULATION_LOGGED",
                "message": "SMTP credentials not configured. Configure Gmail address and 16-character App Password or Resend API key to send live emails.",
                "to": to_email,
                "subject": subject
            }

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"BuyFlow AI Commerce <{creds['user']}>"
        msg["To"] = to_email

        part = MIMEText(html_body, "html")
        msg.attach(part)

        server = None
        last_err = None
        # Strategy 1: IPv4 STARTTLS on port 587
        try:
            server = IPv4SMTP(creds["host"], creds["port"], timeout=12)
            server.ehlo(creds["host"])
            server.starttls()
            server.ehlo(creds["host"])
            server.login(creds["user"], creds["password"])
            server.sendmail(creds["user"], [to_email], msg.as_string())
            server.quit()
            logger.info(f"[EMAIL DELIVERED] Successfully sent email to {to_email} via STARTTLS {creds['port']}")
            return {
                "sent": True,
                "mode": "SMTP_DELIVERED",
                "message": f"Live email delivered successfully to {to_email} via Gmail SMTP!",
                "to": to_email
            }
        except Exception as e_starttls:
            last_err = e_starttls
            logger.warning(f"STARTTLS attempt on port {creds['port']} failed: {e_starttls}. Retrying via SSL on port 465...")

        # Strategy 2: IPv4 direct SSL on port 465 fallback
        try:
            ssl_ctx = ssl.create_default_context()
            server = IPv4SMTP_SSL(creds["host"], 465, timeout=12, context=ssl_ctx)
            server.ehlo(creds["host"])
            server.login(creds["user"], creds["password"])
            server.sendmail(creds["user"], [to_email], msg.as_string())
            server.quit()
            logger.info(f"[EMAIL DELIVERED] Successfully sent email to {to_email} via SSL 465")
            return {
                "sent": True,
                "mode": "SMTP_DELIVERED",
                "message": f"Live email delivered successfully to {to_email} via Gmail SMTP SSL!",
                "to": to_email
            }
        except Exception as e_ssl:
            last_err = e_ssl
            logger.error(f"[EMAIL ERROR] Both SMTP strategies failed: {e_ssl}")

        err_str = str(last_err)
        friendly_msg = f"SMTP delivery failed: {err_str}"
        if "101" in err_str or "unreachable" in err_str.lower():
            friendly_msg = "Cloud container firewall restriction: Render free tier blocks outbound SMTP ports 465/587 to prevent spam. Unblocked in paid/local environments, or add RESEND_API_KEY for instant HTTPS delivery."

        return {
            "sent": False,
            "mode": "SMTP_ERROR",
            "error": err_str,
            "message": friendly_msg
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