"""Python client for the GridWise FastAPI service.

This is the Python mirror of ``src/lib/api-client.ts``.  It targets the
same five endpoints and uses only the standard library (``urllib``) so
the service has zero non-``fastapi`` runtime dependencies beyond the
web framework itself.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, Optional


class GridWiseError(RuntimeError):
    """Raised when the GridWise service returns a non-2xx response."""

    def __init__(self, status: int, body: str):
        super().__init__(f"GridWise {status}: {body}")
        self.status = status
        self.body = body


class GridWiseClient:
    """Tiny typed client for the GridWise service.

    >>> from service.api_client import GridWiseClient
    >>> gw = GridWiseClient("http://localhost:8000")
    >>> gw.health()
    {'status': 'ok', 'service': 'gridwise', ...}
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: float = 15.0,
    ):
        self.base_url = (
            base_url or os.getenv("GRIDWISE_API_BASE") or "http://localhost:8000"
        ).rstrip("/")
        self.timeout = timeout

    # ---- low-level transport --------------------------------------------

    def _request(self, method: str, path: str, body: Optional[dict] = None) -> Any:
        url = f"{self.base_url}{path}"
        data = None
        headers = {"Accept": "application/json"}
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                payload = resp.read().decode("utf-8")
                return json.loads(payload) if payload else None
        except urllib.error.HTTPError as exc:
            err_body = exc.read().decode("utf-8", errors="replace")
            raise GridWiseError(exc.code, err_body) from exc

    # ---- typed wrappers --------------------------------------------------

    def health(self) -> Dict[str, Any]:
        return self._request("GET", "/health")

    def analyze(self, payload: Optional[dict] = None) -> Dict[str, Any]:
        return self._request("POST", "/analyze", payload or {})

    def recommendations(self, payload: Optional[dict] = None) -> Dict[str, Any]:
        return self._request("POST", "/recommendations", payload or {})

    def appliances(self, payload: Optional[dict] = None) -> Dict[str, Any]:
        return self._request("POST", "/appliances", payload or {})

    def forecast(self, payload: Optional[dict] = None) -> Dict[str, Any]:
        return self._request("POST", "/forecast", payload or {})


# Module-level singleton mirroring the front-end ``gridwise`` object.
gridwise = GridWiseClient()


if __name__ == "__main__":
    import pprint

    pprint.pprint(gridwise.health())
    pprint.pprint(gridwise.analyze())
    pprint.pprint(gridwise.recommendations())
    pprint.pprint(gridwise.appliances())
    pprint.pprint(gridwise.forecast())
