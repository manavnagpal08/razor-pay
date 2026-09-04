from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_chat_search_returns_catalog_fallback_when_supervisor_fails(monkeypatch):
    def fail_supervisor(*args, **kwargs):
        raise RuntimeError("simulated llm outage")

    monkeypatch.setattr(
        "app.services.ai_supervisor.AICommerceSupervisor.process_chat_message",
        fail_supervisor,
    )

    response = client.post(
        "/api/ai/chat/search",
        json={"text": "Hi", "thread_id": "guest_session", "merchant_id": "demo_merchant"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["ai_provider"]["provider"] == "catalog_fallback"
    assert body["ai_provider"]["fallback_reason"] == "RuntimeError"
    assert "results" in body
