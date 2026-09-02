import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

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
        
        return {
            "host": host,
            "port": port,
            "user": user.strip(),
            "password": password.strip().replace(" ", "")  # Gmail App Passwords can have spaces
        }

    @classmethod
    def send_email(cls, to_email: str, subject: str, html_body: str, smtp_override: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Sends an email using standard SMTP. Gracefully falls back to logged simulation if credentials missing.
        """
        creds = cls.get_smtp_credentials(smtp_override)
        
        if not creds["user"] or not creds["password"]:
            logger.info(f"[EMAIL SIMULATION] To: {to_email} | Subject: {subject}")
            return {
                "sent": False,
                "mode": "SIMULATION_LOGGED",
                "message": "SMTP credentials not configured. Configure Gmail address and 16-character App Password to send live emails.",
                "to": to_email,
                "subject": subject
            }

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"Razorpay AI Commerce <{creds['user']}>"
            msg["To"] = to_email

            part = MIMEText(html_body, "html")
            msg.attach(part)

            server = smtplib.SMTP(creds["host"], creds["port"], timeout=10)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(creds["user"], creds["password"])
            server.sendmail(creds["user"], [to_email], msg.as_string())
            server.quit()

            logger.info(f"[EMAIL DELIVERED] Successfully sent email to {to_email} via {creds['host']}")
            return {
                "sent": True,
                "mode": "SMTP_DELIVERED",
                "message": f"Live email delivered successfully to {to_email}!",
                "to": to_email
            }
        except Exception as e:
            logger.error(f"[EMAIL ERROR] Failed to send email via SMTP: {e}")
            return {
                "sent": False,
                "mode": "SMTP_ERROR",
                "error": str(e),
                "message": f"SMTP delivery failed: {str(e)}"
            }

    @classmethod
    def send_otp_email(cls, to_email: str, otp_code: str, store_name: str = "Razorpay AI Storefront", smtp_override: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Sends formatted OTP verification email.
        """
        subject = f"{otp_code} is your {store_name} Verification Code"
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
            .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
            .logo {{ font-size: 20px; font-weight: 800; color: #4f46e5; margin-bottom: 20px; }}
            .otp {{ font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #1e1b4b; background: #eef2ff; border-radius: 12px; padding: 16px 24px; text-align: center; margin: 24px 0; border: 1px dashed #6366f1; font-family: monospace; }}
            .footer {{ font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">⚡ {store_name}</div>
            <h2 style="color: #0f172a; margin-top: 0;">Confirm Your Verification Code</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Please use the verification code below to authorize your transaction or access live shipment tracking in the AI Shopping Assistant.
            </p>
            <div class="otp">{otp_code}</div>
            <p style="color: #64748b; font-size: 13px;">This code expires in 10 minutes. If you did not request this code, you can safely ignore this email.</p>
            <div class="footer">
              Powered by <strong>Razorpay AI Commerce OS</strong> • Secure In-Chat Checkout
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