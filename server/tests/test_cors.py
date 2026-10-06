"""P0 regression: cross-origin requests were rejected (HTTP 400) for any origin
that wasn't in the static allowlist — including dev servers on fallback ports.

The allowlist default (5173/8080) never matched the port the frontend actually
served on (8081, 3000, ...), so every fetch was blocked by CORS and the whole
client appeared down.
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient

from server.main import DevCORSMiddleware, _is_local_origin
from server.core.config import get_settings


def build_app(*, allow_local_origins: bool, allow_origins: list[str]) -> FastAPI:
    """Minimal app carrying the same middleware as the real one."""
    app = FastAPI()
    app.add_middleware(
        DevCORSMiddleware,
        allow_local_origins=allow_local_origins,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/ping")
    async def ping() -> dict:
        return {"ok": True}

    return app


def test_is_local_origin_accepts_loopback_variants():
    for origin in (
        "http://localhost:8081",
        "http://127.0.0.1:3000",
        "http://[::1]:5173",
        "https://localhost:8443",
    ):
        assert _is_local_origin(origin), origin


def test_is_local_origin_rejects_remote_hosts():
    for origin in ("https://evil.example", "http://localhost.evil.com", "null", ""):
        assert not _is_local_origin(origin), origin


def test_local_origin_allowed_on_any_port():
    """Dev servers move ports (8080 -> 8081); localhost origins must pass."""
    client = TestClient(build_app(allow_local_origins=True, allow_origins=[]))
    resp = client.get("/ping", headers={"Origin": "http://localhost:8081"})
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:8081"


def test_preflight_from_fallback_port_allowed():
    """OPTIONS preflight used to return 400 and kill every API call."""
    client = TestClient(build_app(allow_local_origins=True, allow_origins=[]))
    resp = client.options(
        "/ping",
        headers={
            "Origin": "http://127.0.0.1:8081",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert resp.status_code in (200, 204)
    assert resp.headers.get("access-control-allow-origin") in (
        "http://127.0.0.1:8081",
        "*",
    )


def test_remote_origin_rejected():
    """Remote origins must still be blocked when not allowlisted.

    A simple request is answered (the browser enforces the missing header), while
    the preflight that precedes any non-simple call is refused outright.
    """
    client = TestClient(build_app(allow_local_origins=True, allow_origins=[]))
    resp = client.get("/ping", headers={"Origin": "https://evil.example"})
    assert resp.status_code == 200
    assert "access-control-allow-origin" not in resp.headers

    preflight = client.options(
        "/ping",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert preflight.status_code == 400


def test_local_dev_flag_off_rejects_local_origin():
    client = TestClient(build_app(allow_local_origins=False, allow_origins=[]))
    resp = client.get("/ping", headers={"Origin": "http://localhost:8081"})
    assert resp.status_code == 200
    assert "access-control-allow-origin" not in resp.headers

    preflight = client.options(
        "/ping",
        headers={
            "Origin": "http://localhost:8081",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert preflight.status_code == 400


def test_configured_origin_allowed_when_local_dev_off():
    client = TestClient(
        build_app(
            allow_local_origins=False,
            allow_origins=["http://localhost:5173"],
        )
    )
    resp = client.get("/ping", headers={"Origin": "http://localhost:5173"})
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_settings_default_allows_local_dev():
    """Fresh checkouts ship with the flag on so the client works out of the box."""
    assert get_settings().cors_allow_local_dev is True
    assert "http://localhost:5173" in get_settings().cors_origin_list
