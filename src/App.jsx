import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddToGrimoireModal from "./components/AddToGrimoireModal";
import Card from "./components/Card";
import CardModal from "./components/CardModal";
import ConfirmDialog from "./components/ConfirmDialog";
import Filter from "./components/Filter";
import GrimoireFormModal from "./components/GrimoireFormModal";
import GrimoiresView from "./components/GrimoiresView";
import Header from "./components/Header/index.jsx";
import Sidebar from "./components/Sidebar";
import SpellPickerModal from "./components/SpellPickerModal";
import {
  addFavoriteSpell,
  addSpellToGrimoire,
  createGrimoire,
  deleteGrimoire,
  fetchCatalogSpells,
  fetchFavorites,
  fetchGrimoireById,
  fetchGrimoires,
  fetchLibrarySummary,
  removeFavoriteSpell,
  removeSpellFromGrimoire,
  updateGrimoire,
} from "./services/apiClient.js";
import { extractFilterOptions, filterSpells } from "./utils/spellHelpers.js";
import styles from "./App.module.css";

const INITIAL_FILTERS = {
  search: "",
  school: "",
  level: "",
  castingTime: "",
  damageType: "",
};

const TAB_STORAGE_KEY = "grimorio_arcano_active_tab";

function getInitialTab() {
  try {
    const saved = window.localStorage.getItem(TAB_STORAGE_KEY);
    if (saved === "search" || saved === "favorites" || saved === "grimoires") {
      return saved;
    }
  } catch {
    // ignore storage access issues
  }
  return "search";
}

export default function App() {
  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Catálogo da API D&D 5e
  const [spells, setSpells] = useState([]);
  const [isLoadingSpells, setIsLoadingSpells] = useState(true);
  const [spellsError, setSpellsError] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // Biblioteca local SQLite (Favoritos e Grimórios)
  const [favorites, setFavorites] = useState([]);
  const [favoriteIndices, setFavoriteIndices] = useState([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [favoritesError, setFavoritesError] = useState("");

  const [grimoires, setGrimoires] = useState([]);
  const [membershipMap, setMembershipMap] = useState({});
  const [selectedGrimoire, setSelectedGrimoire] = useState(null);
  const [isLoadingGrimoires, setIsLoadingGrimoires] = useState(false);
  const [grimoiresError, setGrimoiresError] = useState("");

  // Modais e feedback visual
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [spellForGrimoireModal, setSpellForGrimoireModal] = useState(null);
  const [grimoireFormState, setGrimoireFormState] = useState({
    isOpen: false,
    mode: "create",
    grimoire: null,
  });
  const [isSubmittingGrimoireForm, setIsSubmittingGrimoireForm] = useState(false);
  const [grimoireToDelete, setGrimoireToDelete] = useState(null);
  const [isDeletingGrimoire, setIsDeletingGrimoire] = useState(false);
  const [isSpellPickerOpen, setIsSpellPickerOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, variant = "info") => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, variant });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(TAB_STORAGE_KEY, activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);

  const loadCatalog = useCallback(async () => {
    setIsLoadingSpells(true);
    setSpellsError("");
    try {
      const data = await fetchCatalogSpells();
      setSpells(Array.isArray(data?.spells) ? data.spells : []);
    } catch (error) {
      setSpellsError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as magias da API D&D 5e."
      );
    } finally {
      setIsLoadingSpells(false);
    }
  }, []);

  const loadLibrarySummary = useCallback(async () => {
    try {
      const summary = await fetchLibrarySummary();
      setFavoriteIndices(
        Array.isArray(summary?.favoriteIndices) ? summary.favoriteIndices : []
      );
      setGrimoires(Array.isArray(summary?.grimoires) ? summary.grimoires : []);
      setMembershipMap(summary?.spellMembership || {});
    } catch {
      // Non-blocking on initial paint; specific views report explicit errors if needed
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    setIsLoadingFavorites(true);
    setFavoritesError("");
    try {
      const data = await fetchFavorites();
      const list = Array.isArray(data?.favorites) ? data.favorites : [];
      setFavorites(list);
      setFavoriteIndices(
        Array.isArray(data?.favoriteIndices)
          ? data.favoriteIndices
          : list.map((item) => item.index)
      );
    } catch (error) {
      setFavoritesError(
        error instanceof Error
          ? error.message
          : "Erro ao carregar magias favoritas."
      );
    } finally {
      setIsLoadingFavorites(false);
    }
  }, []);

  const loadGrimoires = useCallback(async () => {
    setIsLoadingGrimoires(true);
    setGrimoiresError("");
    try {
      const data = await fetchGrimoires();
      setGrimoires(Array.isArray(data?.grimoires) ? data.grimoires : []);
      setMembershipMap(data?.spellMembership || {});
    } catch (error) {
      setGrimoiresError(
        error instanceof Error ? error.message : "Erro ao carregar grimórios."
      );
    } finally {
      setIsLoadingGrimoires(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
    loadLibrarySummary();
  }, [loadCatalog, loadLibrarySummary]);

  useEffect(() => {
    if (activeTab === "favorites") {
      loadFavorites();
    } else if (activeTab === "grimoires") {
      loadGrimoires();
    }
  }, [activeTab, loadFavorites, loadGrimoires]);

  const favoriteIndicesSet = useMemo(
    () => new Set(favoriteIndices),
    [favoriteIndices]
  );

  const filterOptions = useMemo(() => extractFilterOptions(spells), [spells]);

  const filteredSpells = useMemo(
    () => filterSpells(spells, filters),
    [spells, filters]
  );

  const pickerAvailableSpells = useMemo(() => {
    if (spells.length > 0) return spells;
    return favorites;
  }, [spells, favorites]);

  function handleSelectTab(tabId) {
    setActiveTab(tabId);
    if (tabId !== "grimoires") {
      setSelectedGrimoire(null);
    }
  }

  function handleFilterChange(field, value) {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleResetFilters() {
    setFilters(INITIAL_FILTERS);
  }

  async function handleToggleFavorite(spell) {
    const apiIndex = spell?.index;
    if (!apiIndex) return;

    const currentlyFav = favoriteIndicesSet.has(apiIndex);

    // Atualização otimista imediata na UI
    setFavoriteIndices((prev) =>
      currentlyFav ? prev.filter((id) => id !== apiIndex) : [...prev, apiIndex]
    );
    if (currentlyFav) {
      setFavorites((prev) => prev.filter((item) => item.index !== apiIndex));
    }

    try {
      if (currentlyFav) {
        const res = await removeFavoriteSpell(apiIndex);
        setFavoriteIndices(res.favoriteIndices || []);
        showToast(`"${spell.name}" removida dos favoritos.`);
      } else {
        const res = await addFavoriteSpell(spell);
        setFavoriteIndices(res.favoriteIndices || []);
        if (activeTab === "favorites") {
          loadFavorites();
        }
        showToast(`"${spell.name}" adicionada aos favoritos!`);
      }
    } catch (error) {
      // Reverte estado otimista em caso de erro no backend
      setFavoriteIndices((prev) =>
        currentlyFav ? [...prev, apiIndex] : prev.filter((id) => id !== apiIndex)
      );
      if (currentlyFav && activeTab === "favorites") {
        loadFavorites();
      }
      showToast(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar os favoritos.",
        "error"
      );
    }
  }

  async function handleOpenGrimoire(grimoireId) {
    setIsLoadingGrimoires(true);
    setGrimoiresError("");
    try {
      const data = await fetchGrimoireById(grimoireId);
      setSelectedGrimoire(data.grimoire || null);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Erro ao abrir grimório.",
        "error"
      );
    } finally {
      setIsLoadingGrimoires(false);
    }
  }

  async function handleSaveGrimoireForm({ name, description }) {
    setIsSubmittingGrimoireForm(true);
    try {
      if (grimoireFormState.mode === "edit" && grimoireFormState.grimoire) {
        const res = await updateGrimoire(grimoireFormState.grimoire.id, {
          name,
          description,
        });
        const updated = res.grimoire;
        setGrimoires((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        if (selectedGrimoire?.id === updated.id) {
          setSelectedGrimoire((prev) => ({
            ...prev,
            name: updated.name,
            description: updated.description,
            updated_at: updated.updated_at,
          }));
        }
        showToast(`Grimório "${updated.name}" atualizado!`);
      } else {
        const res = await createGrimoire({ name, description });
        const created = res.grimoire;
        setGrimoires((prev) => [created, ...prev]);
        showToast(`Grimório "${created.name}" criado!`);
      }
      setGrimoireFormState({ isOpen: false, mode: "create", grimoire: null });
    } finally {
      setIsSubmittingGrimoireForm(false);
    }
  }

  async function handleQuickCreateGrimoire({ name, description }) {
    const res = await createGrimoire({ name, description });
    const created = res.grimoire;
    setGrimoires((prev) => [created, ...prev]);
    showToast(`Grimório "${created.name}" criado!`);
    return created;
  }

  async function handleConfirmDeleteGrimoire() {
    if (!grimoireToDelete) return;
    setIsDeletingGrimoire(true);
    try {
      const res = await deleteGrimoire(grimoireToDelete.id);
      setGrimoires((prev) =>
        prev.filter((item) => item.id !== grimoireToDelete.id)
      );
      if (res.spellMembership) {
        setMembershipMap(res.spellMembership);
      }
      if (selectedGrimoire?.id === grimoireToDelete.id) {
        setSelectedGrimoire(null);
      }
      showToast(`Grimório "${grimoireToDelete.name}" excluído.`);
      setGrimoireToDelete(null);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Erro ao excluir grimório.",
        "error"
      );
    } finally {
      setIsDeletingGrimoire(false);
    }
  }

  async function handleAddSpellToGrimoire(grimoireId, spell) {
    const res = await addSpellToGrimoire(grimoireId, spell);
    const updatedGrimoire = res.grimoire;
    if (res.spellMembership) {
      setMembershipMap(res.spellMembership);
    }
    setGrimoires((prev) =>
      prev.map((g) =>
        g.id === updatedGrimoire.id
          ? {
              ...g,
              spell_count: updatedGrimoire.spell_count,
              updated_at: updatedGrimoire.updated_at,
            }
          : g
      )
    );
    if (selectedGrimoire?.id === updatedGrimoire.id) {
      setSelectedGrimoire(updatedGrimoire);
    }
    showToast(`"${spell.name}" adicionada ao grimório!`);
  }

  async function handleRemoveSpellFromGrimoire(grimoireId, apiIndex, spellName) {
    const res = await removeSpellFromGrimoire(grimoireId, apiIndex);
    const updatedGrimoire = res.grimoire;
    if (res.spellMembership) {
      setMembershipMap(res.spellMembership);
    }
    setGrimoires((prev) =>
      prev.map((g) =>
        g.id === updatedGrimoire.id
          ? {
              ...g,
              spell_count: updatedGrimoire.spell_count,
              updated_at: updatedGrimoire.updated_at,
            }
          : g
      )
    );
    if (selectedGrimoire?.id === updatedGrimoire.id) {
      setSelectedGrimoire(updatedGrimoire);
    }
    showToast(
      spellName
        ? `"${spellName}" removida do grimório.`
        : "Magia removida do grimório."
    );
  }

  const headerProps = useMemo(() => {
    if (activeTab === "favorites") {
      return {
        kicker: "Biblioteca Pessoal · Persistência Local SQLite3",
        title: "Magias Favoritas",
        subtitle:
          "Consulte suas magias marcadas com estrela a qualquer momento, mesmo sem conexão com a API externa, e organize-as nos seus grimórios.",
        countValue: favorites.length,
        countLabel:
          favorites.length === 1 ? "magia favoritada" : "magias favoritadas",
      };
    }
    if (activeTab === "grimoires") {
      return {
        kicker: "Biblioteca Pessoal · Organização Temática",
        title: selectedGrimoire ? selectedGrimoire.name : "Meus Grimórios",
        subtitle: selectedGrimoire
          ? selectedGrimoire.description ||
            "Visualize, gerencie e remova magias deste grimório personalizado."
          : "Crie múltiplos grimórios personalizados para seus personagens ou estratégias de conjuração.",
        countValue: selectedGrimoire
          ? selectedGrimoire.spells?.length || 0
          : grimoires.length,
        countLabel: selectedGrimoire
          ? "magias neste grimório"
          : grimoires.length === 1
            ? "grimório salvo"
            : "grimórios salvos",
      };
    }
    return {
      kicker: "Compêndio Arcano · D&D 5ª Edição",
      title: "Grimório de Magias",
      subtitle:
        "Consulte, pesquise e filtre todas as magias da API D&D 5e por escola, nível, tempo de conjuração e tipo de dano.",
      countValue: spells.length,
      countLabel: "magias catalogadas na API D&D 5e",
    };
  }, [activeTab, favorites.length, grimoires.length, selectedGrimoire, spells.length]);

  return (
    <div className={styles.pageShell}>
      <div className={styles.container}>
        <div className={styles.workspaceLayout}>
          <Sidebar
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            totalSpellsCount={spells.length}
            favoritesCount={favoriteIndices.length}
            grimoiresCount={grimoires.length}
          />

          <div className={styles.mainColumn}>
            <Header {...headerProps} />

            <main>
              {activeTab === "search" && (
                <>
                  <Filter
                    filters={filters}
                    options={filterOptions}
                    onFilterChange={handleFilterChange}
                    onResetFilters={handleResetFilters}
                    filteredCount={filteredSpells.length}
                    totalCount={spells.length}
                  />

                  {isLoadingSpells && (
                    <div className={styles.stateBox} role="status" aria-live="polite">
                      <div className={styles.spinner} aria-hidden="true" />
                      <h2 className={styles.stateTitle}>Consultando o Grimório</h2>
                      <p className={styles.stateText}>
                        Carregando todas as magias da API de D&amp;D 5e através
                        do backend Python.
                      </p>
                    </div>
                  )}

                  {!isLoadingSpells && spellsError && (
                    <div className={styles.stateBox} role="alert">
                      <h2 className={styles.stateTitle}>Erro ao carregar magias</h2>
                      <p className={styles.stateText}>{spellsError}</p>
                      <button
                        type="button"
                        className={styles.retryButton}
                        onClick={loadCatalog}
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}

                  {!isLoadingSpells &&
                    !spellsError &&
                    filteredSpells.length === 0 && (
                      <div className={styles.stateBox}>
                        <h2 className={styles.stateTitle}>
                          Nenhuma magia encontrada
                        </h2>
                        <p className={styles.stateText}>
                          Nenhuma magia corresponde aos critérios atuais de
                          pesquisa e filtros.
                        </p>
                        <button
                          type="button"
                          className={styles.retryButton}
                          onClick={handleResetFilters}
                        >
                          Limpar filtros
                        </button>
                      </div>
                    )}

                  {!isLoadingSpells &&
                    !spellsError &&
                    filteredSpells.length > 0 && (
                      <section
                        className={styles.spellsGrid}
                        aria-label="Lista de magias"
                      >
                        {filteredSpells.map((spell) => (
                          <Card
                            key={spell?.index || spell?.name}
                            spell={spell}
                            onInspect={setSelectedSpell}
                            isFavorite={favoriteIndicesSet.has(spell?.index)}
                            onToggleFavorite={handleToggleFavorite}
                            grimoireCount={(membershipMap[spell?.index] || []).length}
                            onOpenAddToGrimoire={setSpellForGrimoireModal}
                          />
                        ))}
                      </section>
                    )}
                </>
              )}

              {activeTab === "favorites" && (
                <>
                  {isLoadingFavorites && (
                    <div className={styles.stateBox} role="status" aria-live="polite">
                      <div className={styles.spinner} aria-hidden="true" />
                      <h2 className={styles.stateTitle}>
                        Carregando suas favoritas
                      </h2>
                      <p className={styles.stateText}>
                        Buscando magias favoritadas no banco SQLite local.
                      </p>
                    </div>
                  )}

                  {!isLoadingFavorites && favoritesError && (
                    <div className={styles.stateBox} role="alert">
                      <h2 className={styles.stateTitle}>
                        Erro ao carregar favoritas
                      </h2>
                      <p className={styles.stateText}>{favoritesError}</p>
                      <button
                        type="button"
                        className={styles.retryButton}
                        onClick={loadFavorites}
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}

                  {!isLoadingFavorites &&
                    !favoritesError &&
                    favorites.length === 0 && (
                      <div className={styles.stateBox}>
                        <h2 className={styles.stateTitle}>
                          Nenhuma magia favoritada ainda
                        </h2>
                        <p className={styles.stateText}>
                          Clique na estrela de qualquer magia no buscador para
                          salvá-la no SQLite e acessá-la rapidamente aqui.
                        </p>
                        <button
                          type="button"
                          className={styles.retryButton}
                          onClick={() => handleSelectTab("search")}
                        >
                          Ir para Pesquisar magias
                        </button>
                      </div>
                    )}

                  {!isLoadingFavorites &&
                    !favoritesError &&
                    favorites.length > 0 && (
                      <section
                        className={styles.spellsGrid}
                        aria-label="Magias favoritas"
                      >
                        {favorites.map((spell) => (
                          <Card
                            key={spell.index}
                            spell={spell}
                            onInspect={setSelectedSpell}
                            isFavorite={true}
                            onToggleFavorite={handleToggleFavorite}
                            grimoireCount={(membershipMap[spell.index] || []).length}
                            onOpenAddToGrimoire={setSpellForGrimoireModal}
                          />
                        ))}
                      </section>
                    )}
                </>
              )}

              {activeTab === "grimoires" && (
                <GrimoiresView
                  grimoires={grimoires}
                  selectedGrimoire={selectedGrimoire}
                  isLoading={isLoadingGrimoires}
                  errorMessage={grimoiresError}
                  favoriteIndicesSet={favoriteIndicesSet}
                  onOpenCreateModal={() =>
                    setGrimoireFormState({
                      isOpen: true,
                      mode: "create",
                      grimoire: null,
                    })
                  }
                  onOpenEditModal={(grimoire) =>
                    setGrimoireFormState({
                      isOpen: true,
                      mode: "edit",
                      grimoire,
                    })
                  }
                  onRequestDeleteGrimoire={setGrimoireToDelete}
                  onOpenGrimoire={handleOpenGrimoire}
                  onCloseGrimoire={() => setSelectedGrimoire(null)}
                  onOpenSpellPicker={() => setIsSpellPickerOpen(true)}
                  onRemoveSpellFromGrimoire={(grimoireId, spell) =>
                    handleRemoveSpellFromGrimoire(
                      grimoireId,
                      spell.index,
                      spell.name
                    )
                  }
                  onToggleFavorite={handleToggleFavorite}
                  onInspectSpell={setSelectedSpell}
                  onRetry={loadGrimoires}
                />
              )}
            </main>
          </div>
        </div>
      </div>

      <CardModal
        spell={selectedSpell}
        onClose={() => setSelectedSpell(null)}
        isFavorite={
          selectedSpell ? favoriteIndicesSet.has(selectedSpell.index) : false
        }
        onToggleFavorite={handleToggleFavorite}
        onOpenAddToGrimoire={setSpellForGrimoireModal}
      />

      <AddToGrimoireModal
        spell={spellForGrimoireModal}
        grimoires={grimoires}
        membershipMap={membershipMap}
        onAddSpell={handleAddSpellToGrimoire}
        onRemoveSpell={(grimoireId, apiIndex) =>
          handleRemoveSpellFromGrimoire(
            grimoireId,
            apiIndex,
            spellForGrimoireModal?.name
          )
        }
        onCreateGrimoire={handleQuickCreateGrimoire}
        onClose={() => setSpellForGrimoireModal(null)}
      />

      <GrimoireFormModal
        isOpen={grimoireFormState.isOpen}
        mode={grimoireFormState.mode}
        initialGrimoire={grimoireFormState.grimoire}
        isSubmitting={isSubmittingGrimoireForm}
        onSubmit={handleSaveGrimoireForm}
        onClose={() =>
          setGrimoireFormState({ isOpen: false, mode: "create", grimoire: null })
        }
      />

      <SpellPickerModal
        isOpen={isSpellPickerOpen}
        grimoire={selectedGrimoire}
        availableSpells={pickerAvailableSpells}
        onAddSpell={handleAddSpellToGrimoire}
        onClose={() => setIsSpellPickerOpen(false)}
      />

      <ConfirmDialog
        isOpen={Boolean(grimoireToDelete)}
        title="Excluir grimório"
        message={
          grimoireToDelete
            ? `Tem certeza de que deseja excluir o grimório "${grimoireToDelete.name}"?`
            : ""
        }
        note="Esta ação remove apenas o grimório e seus vínculos. Magias favoritadas ou presentes em outros grimórios permanecerão preservadas."
        confirmLabel="Excluir grimório"
        isSubmitting={isDeletingGrimoire}
        onConfirm={handleConfirmDeleteGrimoire}
        onCancel={() => setGrimoireToDelete(null)}
      />

      {toast && (
        <div
          className={`${styles.toast} ${
            toast.variant === "error" ? styles.toastError : ""
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
