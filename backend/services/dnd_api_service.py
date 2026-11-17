from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
from pathlib import Path
import threading
import time
from typing import Any, Optional
import requests

from backend.config import (
    DND_API_BASE,
    SCHOOL_EMOJIS,
    SPELLS_CACHE_PATH,
    TARGET_LANG,
)
from backend.models.entities import resolve_school_emoji
from backend.services.exceptions import ExternalApiError


class DndApiService:
    """Serviço responsável por consultar a API pública D&D 5e e gerenciar o cache JSON."""

    def __init__(
        self,
        api_base: str = DND_API_BASE,
        target_lang: str = TARGET_LANG,
        cache_path: Path = SPELLS_CACHE_PATH,
        max_workers: int = 12,
        timeout_seconds: float = 12.0,
    ) -> None:
        self.api_base = api_base.rstrip("/")
        self.target_lang = target_lang
        self.cache_path = Path(cache_path)
        self.max_workers = max_workers
        self.timeout_seconds = timeout_seconds
        self._sync_lock = threading.Lock()
        self._session = requests.Session()
        self._session.headers.update(
            {
                "Accept": "application/json",
                "Accept-Language": self.target_lang,
            }
        )

    @property
    def spells_list_url(self) -> str:
        return f"{self.api_base}/api/2014/spells?lang={self.target_lang}"

    def _with_lang_param(self, url: str) -> str:
        if "lang=" in url:
            return url
        separator = "&" if "?" in url else "?"
        return f"{url}{separator}lang={self.target_lang}"

    def _fetch_json_with_retry(self, url: str, retries: int = 2) -> dict[str, Any]:
        last_error: Optional[Exception] = None
        target_url = self._with_lang_param(url)
        for attempt in range(retries + 1):
            try:
                response = self._session.get(target_url, timeout=self.timeout_seconds)
                if not response.ok:
                    raise ExternalApiError(
                        f"HTTP {response.status_code} ao consultar {url}"
                    )
                return response.json()
            except Exception as exc:
                last_error = exc
                if attempt < retries:
                    time.sleep(0.25 * (attempt + 1))
        raise ExternalApiError(
            f"Não foi possível consultar a API D&D 5e: {last_error}"
        )

    def read_cache(self) -> Optional[dict[str, Any]]:
        try:
            if not self.cache_path.exists():
                return None
            raw = self.cache_path.read_text(encoding="utf-8")
            parsed = json.loads(raw)
            if (
                isinstance(parsed, dict)
                and parsed.get("lang") == self.target_lang
                and isinstance(parsed.get("spells"), list)
                and len(parsed["spells"]) > 0
            ):
                return parsed
            return None
        except Exception:
            return None

    def write_cache(self, payload: dict[str, Any]) -> None:
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        temp_file = self.cache_path.with_suffix(".json.tmp")
        temp_file.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        temp_file.replace(self.cache_path)

    def _fetch_single_entry(self, entry: dict[str, Any]) -> dict[str, Any]:
        detail_path = entry.get("url") or f"/api/2014/spells/{entry.get('index')}"
        detail_url = (
            detail_path
            if str(detail_path).startswith("http")
            else f"{self.api_base}{detail_path}"
        )
        spell_data = self._fetch_json_with_retry(detail_url)
        school = spell_data.get("school") or {}
        spell_data["emoji"] = resolve_school_emoji(school.get("index"))
        return spell_data

    def fetch_all_spells(self, force_refresh: bool = False) -> dict[str, Any]:
        if not force_refresh:
            cached = self.read_cache()
            if cached:
                return {**cached, "fromCache": True}

        with self._sync_lock:
            if not force_refresh:
                cached = self.read_cache()
                if cached:
                    return {**cached, "fromCache": True}

            try:
                list_data = self._fetch_json_with_retry(self.spells_list_url)
                spell_refs = list_data.get("results") or []
                if not isinstance(spell_refs, list) or len(spell_refs) == 0:
                    raise ExternalApiError(
                        "A API de D&D 5e não retornou magias na listagem."
                    )

                with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                    detailed_spells = list(
                        executor.map(self._fetch_single_entry, spell_refs)
                    )

                detailed_spells.sort(
                    key=lambda item: (
                        int(item.get("level") or 0),
                        str(item.get("name") or "").casefold(),
                    )
                )

                payload = {
                    "source": self.spells_list_url,
                    "lang": self.target_lang,
                    "updatedAt": datetime.now(timezone.utc).isoformat(),
                    "total": len(detailed_spells),
                    "schoolEmojis": SCHOOL_EMOJIS,
                    "spells": detailed_spells,
                }
                self.write_cache(payload)
                return {**payload, "fromCache": False}
            except ExternalApiError:
                if force_refresh:
                    cached = self.read_cache()
                    if cached:
                        return {**cached, "fromCache": True, "staleFallback": True}
                raise
            except Exception as exc:
                cached = self.read_cache()
                if cached:
                    return {**cached, "fromCache": True, "staleFallback": True}
                raise ExternalApiError(
                    f"Erro ao sincronizar magias da API D&D 5e: {exc}"
                ) from exc

    def fetch_spell_by_index(self, api_index: str) -> Optional[dict[str, Any]]:
        clean_index = str(api_index or "").strip()
        if not clean_index:
            return None

        cached = self.read_cache()
        if cached:
            for item in cached.get("spells", []):
                if item.get("index") == clean_index:
                    return item

        try:
            url = f"{self.api_base}/api/2014/spells/{clean_index}"
            spell_data = self._fetch_json_with_retry(url)
            school = spell_data.get("school") or {}
            spell_data["emoji"] = resolve_school_emoji(school.get("index"))
            return spell_data
        except ExternalApiError:
            return None
