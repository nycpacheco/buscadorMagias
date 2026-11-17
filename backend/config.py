import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

DEFAULT_DB_PATH = Path(os.environ.get("GRIMOIRE_DB_PATH", str(DATA_DIR / "grimoire.db")))
SPELLS_CACHE_PATH = Path(os.environ.get("SPELLS_CACHE_PATH", str(DATA_DIR / "spells-cache.json")))

DND_API_BASE = os.environ.get("DND_API_BASE", "https://www.dnd5eapi.co")
TARGET_LANG = os.environ.get("DND_TARGET_LANG", "pt-BR")

BACKEND_HOST = os.environ.get("BACKEND_HOST", "0.0.0.0")
BACKEND_PORT = int(os.environ.get("BACKEND_PORT", os.environ.get("PORT", "5000")))

SCHOOL_EMOJIS = {
    "abjuration": "🛡️",
    "conjuration": "🌀",
    "divination": "👁️",
    "enchantment": "💖",
    "evocation": "💥",
    "illusion": "🎭",
    "necromancy": "💀",
    "transmutation": "🧪",
}
