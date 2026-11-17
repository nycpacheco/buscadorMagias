import sqlite3
import tempfile
import unittest
from pathlib import Path

from app import create_app
from backend.database.db_manager import DatabaseManager
from backend.services.dnd_api_service import DndApiService


SAMPLE_SPELLS = [
    {
        "index": "fireball",
        "name": "Bola de Fogo",
        "level": 3,
        "school": {"index": "evocation", "name": "Evocation"},
        "casting_time": "1 ação",
        "range": "45 metros",
        "components": ["V", "S", "M"],
        "material": "Guano de morcego e enxofre.",
        "duration": "Instantânea",
        "ritual": False,
        "concentration": False,
        "desc": ["Uma explosão ígnea irrompe no ponto escolhido."],
        "higher_level": ["O dano aumenta em 1d6 por espaço acima do 3º."],
        "dc": {"dc_type": {"index": "dex", "name": "DEX"}, "dc_success": "half"},
        "damage": [
            {
                "damage_type": {"index": "fire", "name": "Fire"},
                "damage_at_slot_level": {"3": "8d6", "4": "9d6"},
            }
        ],
        "classes": [{"index": "wizard", "name": "Wizard"}],
        "subclasses": [],
        "emoji": "💥",
    },
    {
        "index": "shield",
        "name": "Escudo Arcano",
        "level": 1,
        "school": {"index": "abjuration", "name": "Abjuration"},
        "casting_time": "1 reação",
        "range": "Pessoal",
        "components": ["V", "S"],
        "duration": "1 rodada",
        "ritual": False,
        "concentration": False,
        "desc": ["Uma barreira invisível protege você até seu próximo turno."],
        "higher_level": [],
        "classes": [{"index": "wizard", "name": "Wizard"}],
        "subclasses": [],
        "emoji": "🛡️",
    },
]


class StubDndApiService(DndApiService):
    def __init__(self, fail_api: bool = False):
        super().__init__(cache_path=Path("/nonexistent/cache.json"))
        self.fail_api = fail_api

    def fetch_all_spells(self, force_refresh: bool = False):
        if self.fail_api:
            from backend.services.exceptions import ExternalApiError
            raise ExternalApiError("API D&D 5e indisponível no teste.")
        return {
            "source": "stub",
            "lang": "pt-BR",
            "total": len(SAMPLE_SPELLS),
            "spells": SAMPLE_SPELLS,
            "fromCache": False,
        }

    def fetch_spell_by_index(self, api_index: str):
        if self.fail_api:
            return None
        for item in SAMPLE_SPELLS:
            if item["index"] == api_index:
                return item
        return None


class LibraryBackendTestCase(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tmpdir.name) / "test_grimoire.db"
        self.app = create_app(
            db_path=self.db_path,
            dnd_api_service=StubDndApiService(),
        )
        self.client = self.app.test_client()

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_database_has_four_relational_tables_and_foreign_keys(self):
        conn = sqlite3.connect(self.db_path)
        tables = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
            ).fetchall()
        }
        conn.close()
        self.assertEqual(tables, {"spells", "favorites", "grimoires", "grimoire_spells"})

        db = DatabaseManager(self.db_path)
        with db.get_connection() as conn:
            fk_status = conn.execute("PRAGMA foreign_keys;").fetchone()[0]
            self.assertEqual(fk_status, 1)

    def test_favorites_and_grimoires_are_completely_independent(self):
        # Favoritar Bola de Fogo
        res = self.client.post("/api/favorites", json={"spell": SAMPLE_SPELLS[0]})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.get_json()["favoriteIndices"], ["fireball"])

        # Favoritar novamente é idempotente (1 ocorrência)
        res_dup = self.client.post("/api/favorites", json={"index": "fireball"})
        self.assertEqual(res_dup.status_code, 201)
        self.assertEqual(len(self.client.get("/api/favorites").get_json()["favorites"]), 1)

        # Criar dois grimórios
        g1 = self.client.post(
            "/api/grimoires",
            json={"name": "Grimório de Dano", "description": "Foco em explosões"},
        ).get_json()["grimoire"]
        g2 = self.client.post(
            "/api/grimoires",
            json={"name": "Grimório de Defesa", "description": "Proteções"},
        ).get_json()["grimoire"]

        # Adicionar Bola de Fogo em ambos
        res_add1 = self.client.post(
            f"/api/grimoires/{g1['id']}/spells", json={"spell": SAMPLE_SPELLS[0]}
        )
        self.assertEqual(res_add1.status_code, 201)
        res_add2 = self.client.post(
            f"/api/grimoires/{g2['id']}/spells", json={"index": "fireball"}
        )
        self.assertEqual(res_add2.status_code, 201)

        # Duplicata no mesmo grimório deve ser bloqueada (409)
        res_conflict = self.client.post(
            f"/api/grimoires/{g1['id']}/spells", json={"index": "fireball"}
        )
        self.assertEqual(res_conflict.status_code, 409)

        # Desfavoritar Bola de Fogo NÃO deve removê-la dos grimórios
        res_unfav = self.client.delete("/api/favorites/fireball")
        self.assertEqual(res_unfav.status_code, 200)
        self.assertFalse(res_unfav.get_json()["orphan_cleaned"])

        g1_detail = self.client.get(f"/api/grimoires/{g1['id']}").get_json()["grimoire"]
        self.assertEqual([s["index"] for s in g1_detail["spells"]], ["fireball"])

        # Adicionar Escudo Arcano ao Grimório 2 e favoritá-lo
        self.client.post("/api/favorites", json={"spell": SAMPLE_SPELLS[1]})
        self.client.post(
            f"/api/grimoires/{g2['id']}/spells", json={"spell": SAMPLE_SPELLS[1]}
        )

        # Excluir Grimório 2 NÃO deve apagar Escudo Arcano dos favoritos nem afetar Grimório 1
        res_del_g2 = self.client.delete(f"/api/grimoires/{g2['id']}")
        self.assertEqual(res_del_g2.status_code, 200)

        favs = self.client.get("/api/favorites").get_json()["favorites"]
        self.assertEqual([f["index"] for f in favs], ["shield"])

        g1_after = self.client.get(f"/api/grimoires/{g1['id']}").get_json()["grimoire"]
        self.assertEqual([s["index"] for s in g1_after["spells"]], ["fireball"])

        # Remover Bola de Fogo de Grimório 1 limpa a magia órfã de spells
        res_rem = self.client.delete(f"/api/grimoires/{g1['id']}/spells/fireball")
        self.assertEqual(res_rem.status_code, 200)
        self.assertEqual(res_rem.get_json()["grimoire"]["spells"], [])

    def test_grimoire_crud_validation_and_offline_persistence(self):
        # Validação nome vazio
        bad = self.client.post("/api/grimoires", json={"name": "   "})
        self.assertEqual(bad.status_code, 400)

        created = self.client.post(
            "/api/grimoires",
            json={"name": "Suporte", "description": "Curas e buffs"},
        ).get_json()["grimoire"]

        updated = self.client.put(
            f"/api/grimoires/{created['id']}",
            json={"name": "Suporte Tático", "description": "Curas e utilidades"},
        ).get_json()["grimoire"]
        self.assertEqual(updated["name"], "Suporte Tático")
        self.assertEqual(updated["description"], "Curas e utilidades")

        # Favoritar e adicionar magia e simular reinício com API externa offline
        self.client.post("/api/favorites", json={"spell": SAMPLE_SPELLS[0]})
        self.client.post(
            f"/api/grimoires/{created['id']}/spells", json={"spell": SAMPLE_SPELLS[1]}
        )

        offline_app = create_app(
            db_path=self.db_path,
            dnd_api_service=StubDndApiService(fail_api=True),
        )
        offline_client = offline_app.test_client()

        # Busca online falha com 502 amigável, mas favoritos e grimórios continuam funcionando
        self.assertEqual(offline_client.get("/api/spells").status_code, 502)
        favs = offline_client.get("/api/favorites").get_json()["favorites"]
        self.assertEqual([f["index"] for f in favs], ["fireball"])
        grimoire = offline_client.get(f"/api/grimoires/{created['id']}").get_json()["grimoire"]
        self.assertEqual([s["index"] for s in grimoire["spells"]], ["shield"])


if __name__ == "__main__":
    unittest.main()
