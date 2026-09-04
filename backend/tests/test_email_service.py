import json
from unittest.mock import patch

from app.services.email_service import EmailService


class _FakeBrevoResponse:
    status = 201

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return b'{"messageId":"mock-message-id"}'


def test_brevo_rest_sends_with_configured_verified_sender(monkeypatch):
    captured = {}

    def fake_urlopen(request, timeout):
        captured["url"] = request.full_url
        captured["headers"] = dict(request.header_items())
        captured["body"] = json.loads(request.data.decode("utf-8"))
        captured["timeout"] = timeout
        return _FakeBrevoResponse()

    monkeypatch.delenv("BREVO_API_KEY", raising=False)
    monkeypatch.delenv("BREVO_SENDER_EMAIL", raising=False)

    override = {
        "active_provider": "brevo",
        "brevo_api_key": "xkeysib-test-key",
        "brevo_sender_email": "verified@example.com",
        "sender_name": "OM Store",
    }

    with patch("urllib.request.urlopen", side_effect=fake_urlopen):
        result = EmailService.send_otp_email(
            "customer@example.com",
            "123456",
            store_name="OM Store",
            smtp_override=override,
        )

    assert result["sent"] is True
    assert result["mode"] == "BREVO_HTTPS"
    assert captured["url"] == "https://api.brevo.com/v3/smtp/email"
    assert captured["body"]["sender"] == {"name": "OM Store", "email": "verified@example.com"}
    assert captured["body"]["to"] == [{"email": "customer@example.com"}]
    assert captured["headers"]["Api-key"] == "xkeysib-test-key"


def test_brevo_requires_sender_email():
    result = EmailService.send_otp_email(
        "customer@example.com",
        "123456",
        smtp_override={"active_provider": "brevo", "brevo_api_key": "xkeysib-test-key"},
    )

    assert result["sent"] is False
    assert result["mode"] == "BREVO_SENDER_MISSING"


def test_brevo_rejects_wrong_key_format():
    result = EmailService.send_otp_email(
        "customer@example.com",
        "123456",
        smtp_override={
            "active_provider": "brevo",
            "brevo_api_key": "bad-key",
            "brevo_sender_email": "verified@example.com",
        },
    )

    assert result["sent"] is False
    assert result["mode"] == "BREVO_KEY_TYPE_INVALID"
