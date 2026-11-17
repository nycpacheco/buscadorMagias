from flask import Blueprint, jsonify, request

from backend.services.exceptions import DomainError
from backend.services.library_service import LibraryService


class ApiController:
    """Define os endpoints REST para comunicação entre frontend React e backend Python."""

    def __init__(self, library_service: LibraryService) -> None:
        self.library_service = library_service
        self.blueprint = Blueprint("api", __name__, url_prefix="/api")
        self._register_routes()

    def _register_routes(self) -> None:
        bp = self.blueprint

        @bp.get("/health")
        def health():
            return jsonify({"status": "ok", "database": "sqlite3"})

        @bp.get("/spells")
        def get_spells():
            refresh = request.args.get("refresh", "").lower() in ("1", "true", "yes")
            payload = self.library_service.get_catalog_spells(force_refresh=refresh)
            return jsonify(payload)

        @bp.get("/spells/<string:api_index>")
        def get_spell_detail(api_index: str):
            spell = self.library_service.get_spell_detail(api_index)
            return jsonify({"spell": spell})

        @bp.get("/library/summary")
        def get_library_summary():
            return jsonify(
                {
                    "favoriteIndices": self.library_service.list_favorite_indices(),
                    "grimoires": self.library_service.list_grimoires(),
                    "spellMembership": self.library_service.get_spell_membership_map(),
                }
            )

        @bp.get("/favorites")
        def list_favorites():
            favorites = self.library_service.list_favorites()
            return jsonify(
                {
                    "favorites": favorites,
                    "favoriteIndices": [f.get("index") for f in favorites if f.get("index")],
                }
            )

        @bp.post("/favorites")
        def add_favorite():
            body = request.get_json(silent=True) or {}
            spell_payload = body.get("spell") if isinstance(body.get("spell"), dict) else None
            api_index = body.get("index") or (spell_payload.get("index") if spell_payload else "")
            created = self.library_service.add_favorite(api_index, spell_payload)
            return jsonify(
                {
                    "favorite": created,
                    "favoriteIndices": self.library_service.list_favorite_indices(),
                }
            ), 201

        @bp.delete("/favorites/<string:api_index>")
        def remove_favorite(api_index: str):
            result = self.library_service.remove_favorite(api_index)
            return jsonify(
                {
                    **result,
                    "favoriteIndices": self.library_service.list_favorite_indices(),
                }
            )

        @bp.get("/grimoires")
        def list_grimoires():
            return jsonify(
                {
                    "grimoires": self.library_service.list_grimoires(),
                    "spellMembership": self.library_service.get_spell_membership_map(),
                }
            )

        @bp.post("/grimoires")
        def create_grimoire():
            body = request.get_json(silent=True) or {}
            created = self.library_service.create_grimoire(
                name=body.get("name"),
                description=body.get("description", ""),
            )
            return jsonify({"grimoire": created}), 201

        @bp.get("/grimoires/<int:grimoire_id>")
        def get_grimoire(grimoire_id: int):
            grimoire = self.library_service.get_grimoire(grimoire_id)
            return jsonify({"grimoire": grimoire})

        @bp.put("/grimoires/<int:grimoire_id>")
        @bp.patch("/grimoires/<int:grimoire_id>")
        def update_grimoire(grimoire_id: int):
            body = request.get_json(silent=True) or {}
            updated = self.library_service.update_grimoire(
                grimoire_id=grimoire_id,
                name=body.get("name"),
                description=body.get("description", ""),
            )
            return jsonify({"grimoire": updated})

        @bp.delete("/grimoires/<int:grimoire_id>")
        def delete_grimoire(grimoire_id: int):
            result = self.library_service.delete_grimoire(grimoire_id)
            return jsonify(
                {
                    **result,
                    "spellMembership": self.library_service.get_spell_membership_map(),
                }
            )

        @bp.post("/grimoires/<int:grimoire_id>/spells")
        def add_spell_to_grimoire(grimoire_id: int):
            body = request.get_json(silent=True) or {}
            spell_payload = body.get("spell") if isinstance(body.get("spell"), dict) else None
            api_index = body.get("index") or (spell_payload.get("index") if spell_payload else "")
            grimoire = self.library_service.add_spell_to_grimoire(
                grimoire_id=grimoire_id,
                api_index=api_index,
                spell_payload=spell_payload,
            )
            return jsonify(
                {
                    "grimoire": grimoire,
                    "spellMembership": self.library_service.get_spell_membership_map(),
                }
            ), 201

        @bp.delete("/grimoires/<int:grimoire_id>/spells/<string:api_index>")
        def remove_spell_from_grimoire(grimoire_id: int, api_index: str):
            grimoire = self.library_service.remove_spell_from_grimoire(
                grimoire_id=grimoire_id,
                api_index=api_index,
            )
            return jsonify(
                {
                    "grimoire": grimoire,
                    "spellMembership": self.library_service.get_spell_membership_map(),
                }
            )


def register_error_handlers(app) -> None:
    @app.errorhandler(DomainError)
    def handle_domain_error(error: DomainError):
        return jsonify({"error": error.message}), error.status_code

    @app.errorhandler(404)
    def handle_not_found(_error):
        return jsonify({"error": "Recurso não encontrado."}), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(_error):
        return jsonify({"error": "Método HTTP não permitido."}), 405

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        app.logger.exception("Erro interno inesperado: %s", error)
        return jsonify({"error": "Erro interno no servidor Python."}), 500
