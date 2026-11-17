import sqlite3
from typing import Optional

from backend.database.db_manager import DatabaseManager
from backend.models.entities import Favorite, Spell, utc_now_iso


class FavoriteRepository:
    """Repositório responsável pelas operações CRUD na tabela `favorites`."""

    def __init__(self, db_manager: DatabaseManager) -> None:
        self.db_manager = db_manager

    def list_all(self) -> list[Favorite]:
        with self.db_manager.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT
                    s.*,
                    f.id AS fav_id,
                    f.spell_id AS spell_id,
                    f.created_at AS fav_created_at
                FROM favorites f
                INNER JOIN spells s ON s.id = f.spell_id
                ORDER BY f.created_at DESC, s.level ASC, s.name COLLATE NOCASE ASC
                """
            ).fetchall()
            return [
                Favorite.from_row(row, spell=Spell.from_row(row))
                for row in rows
            ]

    def list_spell_indices(self) -> list[str]:
        with self.db_manager.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT s.api_index
                FROM favorites f
                INNER JOIN spells s ON s.id = f.spell_id
                """
            ).fetchall()
            return [str(row["api_index"]) for row in rows]

    def is_favorited(self, api_index: str) -> bool:
        with self.db_manager.get_connection() as conn:
            row = conn.execute(
                """
                SELECT 1
                FROM favorites f
                INNER JOIN spells s ON s.id = f.spell_id
                WHERE s.api_index = ?
                """,
                (api_index,),
            ).fetchone()
            return row is not None

    def add_with_connection(
        self, conn: sqlite3.Connection, spell_id: int
    ) -> Favorite:
        existing = conn.execute(
            "SELECT id, spell_id, created_at FROM favorites WHERE spell_id = ?",
            (spell_id,),
        ).fetchone()
        if existing:
            return Favorite.from_row(existing)

        now = utc_now_iso()
        cursor = conn.execute(
            "INSERT INTO favorites (spell_id, created_at) VALUES (?, ?)",
            (spell_id, now),
        )
        return Favorite(id=cursor.lastrowid, spell_id=spell_id, created_at=now)

    def remove_by_api_index_with_connection(
        self, conn: sqlite3.Connection, api_index: str
    ) -> Optional[int]:
        row = conn.execute(
            """
            SELECT f.id AS fav_id, f.spell_id AS spell_id
            FROM favorites f
            INNER JOIN spells s ON s.id = f.spell_id
            WHERE s.api_index = ?
            """,
            (api_index,),
        ).fetchone()
        if not row:
            return None

        conn.execute("DELETE FROM favorites WHERE id = ?", (row["fav_id"],))
        return int(row["spell_id"])
