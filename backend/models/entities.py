from dataclasses import dataclass, field
from datetime import datetime, timezone
import json
import sqlite3
from typing import Any, Optional

from backend.config import SCHOOL_EMOJIS


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def resolve_school_emoji(school_index: Optional[str]) -> str:
    key = school_index.lower().strip() if isinstance(school_index, str) else ""
    return SCHOOL_EMOJIS.get(key, "✨")


@dataclass
class Spell:
    """Representa uma magia da D&D 5e persistida localmente no SQLite."""

    api_index: str
    name: str
    level: int
    school_index: str = ""
    school_name: str = ""
    casting_time: str = ""
    spell_range: str = ""
    components: list[str] = field(default_factory=list)
    material: str = ""
    duration: str = ""
    ritual: bool = False
    concentration: bool = False
    description: list[str] = field(default_factory=list)
    higher_level: list[str] = field(default_factory=list)
    additional_info: dict[str, Any] = field(default_factory=dict)
    raw_data: dict[str, Any] = field(default_factory=dict)
    updated_at: str = field(default_factory=utc_now_iso)
    id: Optional[int] = None

    @classmethod
    def from_api_dict(cls, payload: dict[str, Any]) -> "Spell":
        if not isinstance(payload, dict):
            raise ValueError("Dados da magia inválidos.")

        api_index = str(payload.get("index") or "").strip()
        name = str(payload.get("name") or "").strip()
        if not api_index or not name:
            raise ValueError("A magia deve possuir 'index' e 'name'.")

        raw_level = payload.get("level", 0)
        try:
            level = int(raw_level)
        except (TypeError, ValueError) as exc:
            raise ValueError("O nível da magia deve ser numérico.") from exc

        school = payload.get("school") if isinstance(payload.get("school"), dict) else {}
        school_index = str(school.get("index") or "").strip()
        school_name = str(school.get("name") or "").strip()

        components = payload.get("components")
        if not isinstance(components, list):
            components = []

        desc = payload.get("desc")
        if isinstance(desc, str):
            desc = [desc]
        elif not isinstance(desc, list):
            desc = []

        higher_level = payload.get("higher_level")
        if isinstance(higher_level, str):
            higher_level = [higher_level]
        elif not isinstance(higher_level, list):
            higher_level = []

        emoji = payload.get("emoji") or resolve_school_emoji(school_index)
        raw_copy = dict(payload)
        raw_copy["emoji"] = emoji

        additional_info = {
            "emoji": emoji,
            "attack_type": payload.get("attack_type"),
            "dc": payload.get("dc"),
            "area_of_effect": payload.get("area_of_effect"),
            "damage": payload.get("damage"),
            "heal_at_slot_level": payload.get("heal_at_slot_level"),
            "classes": payload.get("classes", []),
            "subclasses": payload.get("subclasses", []),
            "url": payload.get("url"),
        }

        return cls(
            api_index=api_index,
            name=name,
            level=level,
            school_index=school_index,
            school_name=school_name,
            casting_time=str(payload.get("casting_time") or ""),
            spell_range=str(payload.get("range") or ""),
            components=[str(c) for c in components],
            material=str(payload.get("material") or ""),
            duration=str(payload.get("duration") or ""),
            ritual=bool(payload.get("ritual", False)),
            concentration=bool(payload.get("concentration", False)),
            description=[str(item) for item in desc],
            higher_level=[str(item) for item in higher_level],
            additional_info=additional_info,
            raw_data=raw_copy,
            updated_at=utc_now_iso(),
        )

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "Spell":
        raw_data = json.loads(row["raw_data"]) if row["raw_data"] else {}
        components = json.loads(row["components"]) if row["components"] else []
        description = json.loads(row["description"]) if row["description"] else []
        higher_level = json.loads(row["higher_level"]) if row["higher_level"] else []
        additional_info = json.loads(row["additional_info"]) if row["additional_info"] else {}

        return cls(
            id=row["id"],
            api_index=row["api_index"],
            name=row["name"],
            level=row["level"],
            school_index=row["school_index"] or "",
            school_name=row["school_name"] or "",
            casting_time=row["casting_time"] or "",
            spell_range=row["spell_range"] or "",
            components=components,
            material=row["material"] or "",
            duration=row["duration"] or "",
            ritual=bool(row["ritual"]),
            concentration=bool(row["concentration"]),
            description=description,
            higher_level=higher_level,
            additional_info=additional_info,
            raw_data=raw_data,
            updated_at=row["updated_at"],
        )

    def to_api_dict(self) -> dict[str, Any]:
        """Retorna o objeto completo compatível com o formato da API D&D 5e e o frontend."""
        if self.raw_data:
            data = dict(self.raw_data)
        else:
            data = {
                "index": self.api_index,
                "name": self.name,
                "level": self.level,
                "school": {
                    "index": self.school_index,
                    "name": self.school_name,
                },
                "casting_time": self.casting_time,
                "range": self.spell_range,
                "components": self.components,
                "material": self.material,
                "duration": self.duration,
                "ritual": self.ritual,
                "concentration": self.concentration,
                "desc": self.description,
                "higher_level": self.higher_level,
                **self.additional_info,
            }
        data["db_id"] = self.id
        data["emoji"] = data.get("emoji") or resolve_school_emoji(self.school_index)
        data["saved_at"] = self.updated_at
        return data


@dataclass
class Favorite:
    """Representa um registro de magia favoritada."""

    spell_id: int
    created_at: str = field(default_factory=utc_now_iso)
    id: Optional[int] = None
    spell: Optional[Spell] = None

    @classmethod
    def from_row(cls, row: sqlite3.Row, spell: Optional[Spell] = None) -> "Favorite":
        return cls(
            id=row["fav_id"] if "fav_id" in row.keys() else row["id"],
            spell_id=row["spell_id"],
            created_at=row["fav_created_at"] if "fav_created_at" in row.keys() else row["created_at"],
            spell=spell,
        )

    def to_dict(self) -> dict[str, Any]:
        payload = self.spell.to_api_dict() if self.spell else {"spell_id": self.spell_id}
        payload["favorite_id"] = self.id
        payload["favorited_at"] = self.created_at
        return payload


@dataclass
class Grimoire:
    """Representa um grimório personalizado criado pelo usuário."""

    name: str
    description: str = ""
    created_at: str = field(default_factory=utc_now_iso)
    updated_at: str = field(default_factory=utc_now_iso)
    id: Optional[int] = None
    spell_count: int = 0
    spells: list[Spell] = field(default_factory=list)

    @classmethod
    def validate_fields(cls, name: Any, description: Any = "") -> tuple[str, str]:
        clean_name = str(name or "").strip()
        if not clean_name:
            raise ValueError("O nome do grimório é obrigatório.")
        if len(clean_name) > 100:
            raise ValueError("O nome do grimório deve ter no máximo 100 caracteres.")

        clean_desc = str(description or "").strip()
        if len(clean_desc) > 500:
            raise ValueError("A descrição do grimório deve ter no máximo 500 caracteres.")
        return clean_name, clean_desc

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "Grimoire":
        keys = row.keys()
        return cls(
            id=row["id"],
            name=row["name"],
            description=row["description"] or "",
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            spell_count=int(row["spell_count"]) if "spell_count" in keys else 0,
        )

    def to_dict(self, include_spells: bool = False) -> dict[str, Any]:
        data: dict[str, Any] = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "spell_count": self.spell_count if not include_spells else len(self.spells),
        }
        if include_spells:
            data["spells"] = [spell.to_api_dict() for spell in self.spells]
        return data


@dataclass
class GrimoireSpell:
    """Representa a associação muitos-para-muitos entre grimório e magia."""

    grimoire_id: int
    spell_id: int
    added_at: str = field(default_factory=utc_now_iso)
    id: Optional[int] = None
