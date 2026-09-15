"""Unit tests for the server-side Geoengine credential proxy."""

import asyncio

import httpx
import pytest
from starlette.requests import Request

from backend import server


def make_request(method="POST", body=b'{"cells":[]}', query=b"source=console"):
    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    return Request(
        {
            "type": "http",
            "http_version": "1.1",
            "method": method,
            "scheme": "https",
            "path": "/api/geoengine/locate",
            "raw_path": b"/api/geoengine/locate",
            "query_string": query,
            "headers": [(b"content-type", b"application/json")],
            "client": ("127.0.0.1", 50000),
            "server": ("testserver", 443),
        },
        receive,
    )


def test_proxy_attaches_key_and_preserves_upstream_response(monkeypatch):
    calls = []

    class FakeClient:
        async def aclose(self):
            return None

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        def build_request(self, method, url, **kwargs):
            return method, url, kwargs

        async def send(self, request, stream=False):
            calls.append((*request, stream))
            return httpx.Response(
                201,
                content=b"location export",
                headers={
                    "content-type": "text/csv",
                    "content-disposition": 'attachment; filename="fixes.csv"',
                },
            )

    monkeypatch.setenv("GEOENGINE_API_URL", "https://geoengine.example.test/api/")
    monkeypatch.setenv("GEOENGINE_API_KEY", "private-key")
    monkeypatch.setenv("GEOENGINE_API_KEY_HEADER", "authorization")
    monkeypatch.setattr(server.httpx, "AsyncClient", lambda **kwargs: FakeClient())

    response = asyncio.run(server.proxy_geoengine(make_request(), "exports/history"))

    assert response.status_code == 201
    body = b""
    async def collect_body():
        nonlocal body
        async for chunk in response.body_iterator:
            body += chunk
    asyncio.run(collect_body())
    assert body == b"location export"
    assert response.headers["content-disposition"] == 'attachment; filename="fixes.csv"'
    assert calls[0][0] == "POST"
    assert calls[0][1] == "https://geoengine.example.test/api/exports/history"
    assert calls[0][2]["headers"]["authorization"] == "private-key"
    assert calls[0][2]["content"] == b'{"cells":[]}'
    assert str(calls[0][2]["params"]) == "source=console"
    assert calls[0][3] is True


def test_proxy_reports_missing_backend_configuration(monkeypatch):
    monkeypatch.delenv("GEOENGINE_API_URL", raising=False)
    with pytest.raises(server.HTTPException) as error:
        server._geoengine_configuration()
    assert error.value.status_code == 503


def test_proxy_rejects_unsafe_api_key_header(monkeypatch):
    monkeypatch.setenv("GEOENGINE_API_URL", "https://geoengine.example.test")
    monkeypatch.setenv("GEOENGINE_API_KEY_HEADER", "x-api-key\r\ninjected")

    with pytest.raises(server.HTTPException) as error:
        server._geoengine_configuration()

    assert error.value.status_code == 500


def test_proxy_rejects_non_http_backend_url(monkeypatch):
    monkeypatch.setenv("GEOENGINE_API_URL", "file:///var/run/geoengine.sock")

    with pytest.raises(server.HTTPException) as error:
        server._geoengine_configuration()

    assert error.value.status_code == 500
