from pathlib import Path
from typing import Optional

from flask import Flask, send_from_directory
from flask_cors import CORS

from backend.config import BACKEND_HOST, BACKEND_PORT, BASE_DIR, DEFAULT_DB_PATH
from backend.database.db_manager import DatabaseManager
from backend.repositories.favorite_repository import FavoriteRepository
from backend.repositories.grimoire_repository import GrimoireRepository
from backend.repositories.spell_repository import SpellRepository
from backend.routes.api_routes import ApiController, register_error_handlers
from backend.services.dnd_api_service import DndApiService
from backend.services.library_service import LibraryService


def create_app(
    db_path: Optional[Path | str] = None,
    dnd_api_service: Optional[DndApiService] = None,
) -> Flask:
    """Fábrica da aplicação Flask com injeção de dependências e SQLite inicializado."""
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db_manager = DatabaseManager(db_path or DEFAULT_DB_PATH)
    db_manager.initialize()

    spell_repo = SpellRepository(db_manager)
    favorite_repo = FavoriteRepository(db_manager)
    grimoire_repo = GrimoireRepository(db_manager)
    api_service = dnd_api_service or DndApiService()

    library_service = LibraryService(
        db_manager=db_manager,
        spell_repo=spell_repo,
        favorite_repo=favorite_repo,
        grimoire_repo=grimoire_repo,
        dnd_api_service=api_service,
    )

    controller = ApiController(library_service)
    app.register_blueprint(controller.blueprint)
    register_error_handlers(app)

    dist_dir = BASE_DIR / "dist"
    if dist_dir.is_dir():
        @app.get("/")
        def serve_index():
            return send_from_directory(dist_dir, "index.html")

        @app.get("/<path:asset_path>")
        def serve_static(asset_path: str):
            target = dist_dir / asset_path
            if target.is_file():
                return send_from_directory(dist_dir, asset_path)
            return send_from_directory(dist_dir, "index.html")

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(host=BACKEND_HOST, port=BACKEND_PORT, debug=False)
