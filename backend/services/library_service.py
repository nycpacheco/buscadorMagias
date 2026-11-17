import sqlite3
from typing import Any, Optional

from backend.database.db_manager import DatabaseManager
from backend.models.entities import Grimoire, Spell
from backend.repositories.favorite_repository import FavoriteRepository
from backend.repositories.grimoire_repository import GrimoireRepository
from backend.repositories.spell_repository import SpellRepository
from backend.services.dnd_api_service import DndApiService
from backend.services.exceptions import ConflictError, NotFoundError, ValidationError


class LibraryService:
    """Orquestra as regras de negócio de magias salvas, favoritos e grimórios."""

    def __init__(
        self,
        db_manager: DatabaseManager,
        spell_repo: SpellRepository,
        favorite_repo: FavoriteRepository,
        grimoire_repo: GrimoireRepository,
        dnd_api_service: DndApiService,
    ) -> None:
        self.db_manager = db_manager
        self.spell_repo = spell_repo
        self.favorite_repo = favorite_repo
        self.grimoire_repo = grimoire_repo
        self.dnd_api_service = dnd_api_service

    def _resolve_spell_entity(
        self, api_index: str, spell_payload: Optional[dict[str, Any]] = None
    ) -> Spell:
        clean_index = str(api_index or "").strip()
        if not clean_index:
            raise ValidationError("O identificador da magia é obrigatório.")

        if isinstance(spell_payload, dict) and spell_payload.get("name"):
            payload = dict(spell_payload)
            payload.setdefault("index", clean_index)
            return Spell.from_api_dict(payload)

        existing = self.spell_repo.find_by_api_index(clean_index)
        if existing:
            return existing

        api_data = self.dnd_api_service.fetch_spell_by_index(clean_index)
        if api_data:
            return Spell.from_api_dict(api_data)

        raise NotFoundError(
            f"Magia '{clean_index}' não encontrada no cache local nem na API D&D 5e."
        )

    def get_catalog_spells(self, force_refresh: bool = False) -> dict[str, Any]:
        return self.dnd_api_service.fetch_all_spells(force_refresh=force_refresh)

    def get_spell_detail(self, api_index: str) -> dict[str, Any]:
        clean_index = str(api_index or "").strip()
        if not clean_index:
            raise ValidationError("Identificador da magia inválido.")

        saved = self.spell_repo.find_by_api_index(clean_index)
        if saved:
            return saved.to_api_dict()

        api_data = self.dnd_api_service.fetch_spell_by_index(clean_index)
        if not api_data:
            raise NotFoundError("Magia não encontrada.")
        return api_data

    # --- Favoritos ---

    def list_favorites(self) -> list[dict[str, Any]]:
        favorites = self.favorite_repo.list_all()
        return [fav.to_dict() for fav in favorites]

    def list_favorite_indices(self) -> list[str]:
        return self.favorite_repo.list_spell_indices()

    def add_favorite(
        self, api_index: str, spell_payload: Optional[dict[str, Any]] = None
    ) -> dict[str, Any]:
        spell_entity = self._resolve_spell_entity(api_index, spell_payload)
        with self.db_manager.get_connection() as conn:
            saved_spell = self.spell_repo.upsert_with_connection(conn, spell_entity)
            if saved_spell.id is None:
                raise RuntimeError("Falha ao persistir magia no banco local.")
            fav = self.favorite_repo.add_with_connection(conn, saved_spell.id)
            fav.spell = saved_spell
            return fav.to_dict()

    def remove_favorite(self, api_index: str) -> dict[str, Any]:
        clean_index = str(api_index or "").strip()
        if not clean_index:
            raise ValidationError("O identificador da magia é obrigatório.")

        with self.db_manager.get_connection() as conn:
            removed_spell_id = self.favorite_repo.remove_by_api_index_with_connection(
                conn, clean_index
            )
            if removed_spell_id is None:
                raise NotFoundError("Esta magia não está nos favoritos.")

            cleaned_orphan = self.spell_repo.delete_if_orphan_with_connection(
                conn, removed_spell_id
            )
            return {
                "removed": True,
                "api_index": clean_index,
                "orphan_cleaned": cleaned_orphan,
            }

    # --- Grimórios ---

    def list_grimoires(self) -> list[dict[str, Any]]:
        return [g.to_dict(include_spells=False) for g in self.grimoire_repo.list_all()]

    def get_spell_membership_map(self) -> dict[str, list[int]]:
        return self.grimoire_repo.get_spell_membership_map()

    def get_grimoire(self, grimoire_id: int) -> dict[str, Any]:
        grimoire = self.grimoire_repo.find_by_id(grimoire_id, include_spells=True)
        if not grimoire:
            raise NotFoundError("Grimório não encontrado.")
        return grimoire.to_dict(include_spells=True)

    def create_grimoire(self, name: Any, description: Any = "") -> dict[str, Any]:
        try:
            clean_name, clean_desc = Grimoire.validate_fields(name, description)
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        created = self.grimoire_repo.create(clean_name, clean_desc)
        return created.to_dict(include_spells=False)

    def update_grimoire(
        self, grimoire_id: int, name: Any, description: Any = ""
    ) -> dict[str, Any]:
        try:
            clean_name, clean_desc = Grimoire.validate_fields(name, description)
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        updated = self.grimoire_repo.update(grimoire_id, clean_name, clean_desc)
        if not updated:
            raise NotFoundError("Grimório não encontrado.")
        return updated.to_dict(include_spells=False)

    def delete_grimoire(self, grimoire_id: int) -> dict[str, Any]:
        with self.db_manager.get_connection() as conn:
            try:
                affected_spell_ids = self.grimoire_repo.delete_with_connection(
                    conn, grimoire_id
                )
            except LookupError as exc:
                raise NotFoundError(str(exc)) from exc

            orphans_cleaned = 0
            for spell_id in affected_spell_ids:
                if self.spell_repo.delete_if_orphan_with_connection(conn, spell_id):
                    orphans_cleaned += 1

            return {
                "deleted": True,
                "grimoire_id": grimoire_id,
                "orphans_cleaned": orphans_cleaned,
            }

    def add_spell_to_grimoire(
        self,
        grimoire_id: int,
        api_index: str,
        spell_payload: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        grimoire = self.grimoire_repo.find_by_id(grimoire_id, include_spells=False)
        if not grimoire:
            raise NotFoundError("Grimório não encontrado.")

        spell_entity = self._resolve_spell_entity(api_index, spell_payload)
        with self.db_manager.get_connection() as conn:
            saved_spell = self.spell_repo.upsert_with_connection(conn, spell_entity)
            if saved_spell.id is None:
                raise RuntimeError("Falha ao persistir magia no banco local.")
            try:
                self.grimoire_repo.add_spell_with_connection(
                    conn, grimoire_id, saved_spell.id
                )
            except sqlite3.IntegrityError as exc:
                raise ConflictError("Esta magia já está adicionada neste grimório.") from exc

        return self.get_grimoire(grimoire_id)

    def remove_spell_from_grimoire(
        self, grimoire_id: int, api_index: str
    ) -> dict[str, Any]:
        clean_index = str(api_index or "").strip()
        if not clean_index:
            raise ValidationError("O identificador da magia é obrigatório.")

        grimoire = self.grimoire_repo.find_by_id(grimoire_id, include_spells=False)
        if not grimoire:
            raise NotFoundError("Grimório não encontrado.")

        with self.db_manager.get_connection() as conn:
            removed_spell_id = self.grimoire_repo.remove_spell_with_connection(
                conn, grimoire_id, clean_index
            )
            if removed_spell_id is None:
                raise NotFoundError("Esta magia não faz parte deste grimório.")

            self.spell_repo.delete_if_orphan_with_connection(conn, removed_spell_id)

        return self.get_grimoire(grimoire_id)
