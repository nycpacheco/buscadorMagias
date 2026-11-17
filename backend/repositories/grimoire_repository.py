import sqlite3
from typing import Optional

from backend.database.db_manager import DatabaseManager
from backend.models.entities import Grimoire, Spell, utc_now_iso


class GrimoireRepository:
    """Repositório responsável pelas tabelas `grimoires` e `grimoire_spells`."""

    def __init__(self, db_manager: DatabaseManager) -> None:
        self.db_manager = db_manager

    def create(self, name: str, description: str = "") -> Grimoire:
        now = utc_now_iso()
        with self.db_manager.get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO grimoires (name, description, created_at, updated_at)
                VALUES (?, ?, ?, ?)
                """,
                (name, description, now, now),
            )
            return Grimoire(
                id=cursor.lastrowid,
                name=name,
                description=description,
                created_at=now,
                updated_at=now,
                spell_count=0,
            )

    def list_all(self) -> list[Grimoire]:
        with self.db_manager.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT
                    g.*,
                    COUNT(gs.id) AS spell_count
                FROM grimoires g
                LEFT JOIN grimoire_spells gs ON gs.grimoire_id = g.id
                GROUP BY g.id
                ORDER BY g.updated_at DESC, g.id DESC
                """
            ).fetchall()
            return [Grimoire.from_row(row) for row in rows]

    def find_by_id(self, grimoire_id: int, include_spells: bool = False) -> Optional[Grimoire]:
        with self.db_manager.get_connection() as conn:
            row = conn.execute(
                """
                SELECT
                    g.*,
                    COUNT(gs.id) AS spell_count
                FROM grimoires g
                LEFT JOIN grimoire_spells gs ON gs.grimoire_id = g.id
                WHERE g.id = ?
                GROUP BY g.id
                """,
                (grimoire_id,),
            ).fetchone()
            if not row:
                return None

            grimoire = Grimoire.from_row(row)
            if include_spells:
                spell_rows = conn.execute(
                    """
                    SELECT s.*, gs.added_at AS gs_added_at
                    FROM grimoire_spells gs
                    INNER JOIN spells s ON s.id = gs.spell_id
                    WHERE gs.grimoire_id = ?
                    ORDER BY s.level ASC, s.name COLLATE NOCASE ASC
                    """,
                    (grimoire_id,),
                ).fetchall()
                grimoire.spells = [Spell.from_row(s_row) for s_row in spell_rows]
                grimoire.spell_count = len(grimoire.spells)
            return grimoire

    def update(self, grimoire_id: int, name: str, description: str = "") -> Optional[Grimoire]:
        now = utc_now_iso()
        with self.db_manager.get_connection() as conn:
            cursor = conn.execute(
                """
                UPDATE grimoires
                SET name = ?, description = ?, updated_at = ?
                WHERE id = ?
                """,
                (name, description, now, grimoire_id),
            )
            if cursor.rowcount == 0:
                return None
        return self.find_by_id(grimoire_id, include_spells=False)

    def delete_with_connection(
        self, conn: sqlite3.Connection, grimoire_id: int
    ) -> list[int]:
        """Exclui um grimório e retorna os IDs das magias que pertenciam a ele para limpeza segura."""
        rows = conn.execute(
            "SELECT spell_id FROM grimoire_spells WHERE grimoire_id = ?",
            (grimoire_id,),
        ).fetchall()
        affected_spell_ids = [int(row["spell_id"]) for row in rows]

        cursor = conn.execute("DELETE FROM grimoires WHERE id = ?", (grimoire_id,))
        if cursor.rowcount == 0:
            raise LookupError("Grimório não encontrado.")
        return affected_spell_ids

    def add_spell_with_connection(
        self, conn: sqlite3.Connection, grimoire_id: int, spell_id: int
    ) -> None:
        now = utc_now_iso()
        conn.execute(
            """
            INSERT INTO grimoire_spells (grimoire_id, spell_id, added_at)
            VALUES (?, ?, ?)
            """,
            (grimoire_id, spell_id, now),
        )
        conn.execute(
            "UPDATE grimoires SET updated_at = ? WHERE id = ?",
            (now, grimoire_id),
        )

    def remove_spell_with_connection(
        self, conn: sqlite3.Connection, grimoire_id: int, api_index: str
    ) -> Optional[int]:
        row = conn.execute(
            """
            SELECT gs.id AS link_id, gs.spell_id AS spell_id
            FROM grimoire_spells gs
            INNER JOIN spells s ON s.id = gs.spell_id
            WHERE gs.grimoire_id = ? AND s.api_index = ?
            """,
            (grimoire_id, api_index),
        ).fetchone()
        if not row:
            return None

        conn.execute("DELETE FROM grimoire_spells WHERE id = ?", (row["link_id"],))
        conn.execute(
            "UPDATE grimoires SET updated_at = ? WHERE id = ?",
            (utc_now_iso(), grimoire_id),
        )
        return int(row["spell_id"])

    def get_spell_membership_map(self) -> dict[str, list[int]]:
        """Retorna um mapa api_index -> [grimoire_id, ...] para sincronizar badges na UI."""
        with self.db_manager.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT s.api_index, gs.grimoire_id
                FROM grimoire_spells gs
                INNER JOIN spells s ON s.id = gs.spell_id
                ORDER BY gs.grimoire_id ASC
                """
            ).fetchall()
            membership: dict[str, list[int]] = {}
            for row in rows:
                idx = str(row["api_index"])
                membership.setdefault(idx, []).append(int(row["grimoire_id"]))
            return membership
