import json
import sqlite3
from typing import Optional

from backend.database.db_manager import DatabaseManager
from backend.models.entities import Spell


class SpellRepository:
    """Repositório responsável pela persistência local de magias na tabela `spells`."""

    def __init__(self, db_manager: DatabaseManager) -> None:
        self.db_manager = db_manager

    def upsert_with_connection(self, conn: sqlite3.Connection, spell: Spell) -> Spell:
        conn.execute(
            """
            INSERT INTO spells (
                api_index, name, level, school_index, school_name,
                casting_time, spell_range, components, material, duration,
                ritual, concentration, description, higher_level,
                additional_info, raw_data, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(api_index) DO UPDATE SET
                name = excluded.name,
                level = excluded.level,
                school_index = excluded.school_index,
                school_name = excluded.school_name,
                casting_time = excluded.casting_time,
                spell_range = excluded.spell_range,
                components = excluded.components,
                material = excluded.material,
                duration = excluded.duration,
                ritual = excluded.ritual,
                concentration = excluded.concentration,
                description = excluded.description,
                higher_level = excluded.higher_level,
                additional_info = excluded.additional_info,
                raw_data = excluded.raw_data,
                updated_at = excluded.updated_at
            """,
            (
                spell.api_index,
                spell.name,
                spell.level,
                spell.school_index,
                spell.school_name,
                spell.casting_time,
                spell.spell_range,
                json.dumps(spell.components, ensure_ascii=False),
                spell.material,
                spell.duration,
                1 if spell.ritual else 0,
                1 if spell.concentration else 0,
                json.dumps(spell.description, ensure_ascii=False),
                json.dumps(spell.higher_level, ensure_ascii=False),
                json.dumps(spell.additional_info, ensure_ascii=False),
                json.dumps(spell.raw_data, ensure_ascii=False),
                spell.updated_at,
            ),
        )
        row = conn.execute(
            "SELECT * FROM spells WHERE api_index = ?",
            (spell.api_index,),
        ).fetchone()
        return Spell.from_row(row)

    def upsert(self, spell: Spell) -> Spell:
        with self.db_manager.get_connection() as conn:
            return self.upsert_with_connection(conn, spell)

    def find_by_api_index(self, api_index: str) -> Optional[Spell]:
        with self.db_manager.get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM spells WHERE api_index = ?",
                (api_index,),
            ).fetchone()
            return Spell.from_row(row) if row else None

    def find_by_id(self, spell_id: int) -> Optional[Spell]:
        with self.db_manager.get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM spells WHERE id = ?",
                (spell_id,),
            ).fetchone()
            return Spell.from_row(row) if row else None

    def list_all(self) -> list[Spell]:
        with self.db_manager.get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM spells ORDER BY level ASC, name COLLATE NOCASE ASC"
            ).fetchall()
            return [Spell.from_row(row) for row in rows]

    def delete_if_orphan_with_connection(
        self, conn: sqlite3.Connection, spell_id: int
    ) -> bool:
        """Remove a magia de `spells` apenas se não estiver em favoritos nem em nenhum grimório."""
        row = conn.execute(
            """
            SELECT
                EXISTS(SELECT 1 FROM favorites WHERE spell_id = ?) AS in_favorites,
                EXISTS(SELECT 1 FROM grimoire_spells WHERE spell_id = ?) AS in_grimoires
            """,
            (spell_id, spell_id),
        ).fetchone()
        if row and not row["in_favorites"] and not row["in_grimoires"]:
            cursor = conn.execute("DELETE FROM spells WHERE id = ?", (spell_id,))
            return cursor.rowcount > 0
        return False
