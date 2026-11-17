from contextlib import contextmanager
from pathlib import Path
import sqlite3
from typing import Iterator


import threading


class DatabaseManager:
    """Gerencia conexões SQLite3, integridade referencial e migrações de esquema."""

    CURRENT_SCHEMA_VERSION = 1

    def __init__(self, db_path: Path | str) -> None:
        self.db_path = Path(db_path)
        self._init_lock = threading.Lock()

    def _ensure_parent_dir(self) -> None:
        if str(self.db_path) != ":memory:":
            self.db_path.parent.mkdir(parents=True, exist_ok=True)

    def _raw_connect(self) -> sqlite3.Connection:
        self._ensure_parent_dir()
        conn = sqlite3.connect(str(self.db_path), timeout=15.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def create_connection(self) -> sqlite3.Connection:
        if str(self.db_path) != ":memory:" and not self.db_path.exists():
            self.initialize()
        return self._raw_connect()

    @contextmanager
    def get_connection(self) -> Iterator[sqlite3.Connection]:
        conn = self.create_connection()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def initialize(self) -> None:
        """Cria as 4 tabelas relacionais caso não existam e aplica migrações pendentes."""
        with self._init_lock:
            conn = self._raw_connect()
            try:
                conn.execute("PRAGMA journal_mode = WAL;")
                version_row = conn.execute("PRAGMA user_version;").fetchone()
                current_version = int(version_row[0]) if version_row else 0

                if current_version < 1:
                    self._apply_v1_schema(conn)
                    conn.execute(f"PRAGMA user_version = {self.CURRENT_SCHEMA_VERSION};")
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()

    def _apply_v1_schema(self, conn: sqlite3.Connection) -> None:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS spells (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_index TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                level INTEGER NOT NULL,
                school_index TEXT,
                school_name TEXT,
                casting_time TEXT,
                spell_range TEXT,
                components TEXT,
                material TEXT,
                duration TEXT,
                ritual INTEGER NOT NULL DEFAULT 0,
                concentration INTEGER NOT NULL DEFAULT 0,
                description TEXT NOT NULL,
                higher_level TEXT,
                additional_info TEXT,
                raw_data TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_spells_api_index ON spells(api_index);
            CREATE INDEX IF NOT EXISTS idx_spells_name ON spells(name);

            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                spell_id INTEGER NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                FOREIGN KEY (spell_id) REFERENCES spells(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS grimoires (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS grimoire_spells (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                grimoire_id INTEGER NOT NULL,
                spell_id INTEGER NOT NULL,
                added_at TEXT NOT NULL,
                FOREIGN KEY (grimoire_id) REFERENCES grimoires(id) ON DELETE CASCADE,
                FOREIGN KEY (spell_id) REFERENCES spells(id) ON DELETE CASCADE,
                UNIQUE (grimoire_id, spell_id)
            );

            CREATE INDEX IF NOT EXISTS idx_grimoire_spells_grimoire
                ON grimoire_spells(grimoire_id);
            CREATE INDEX IF NOT EXISTS idx_grimoire_spells_spell
                ON grimoire_spells(spell_id);
            """
        )
