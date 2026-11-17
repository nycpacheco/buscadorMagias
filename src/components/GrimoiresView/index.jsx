import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import Card from '../Card';
import styles from './GrimoiresView.module.css';

export default function GrimoiresView({
  grimoires,
  selectedGrimoire,
  isLoading,
  errorMessage,
  favoriteIndicesSet,
  onOpenCreateModal,
  onOpenEditModal,
  onRequestDeleteGrimoire,
  onOpenGrimoire,
  onCloseGrimoire,
  onOpenSpellPicker,
  onRemoveSpellFromGrimoire,
  onToggleFavorite,
  onInspectSpell,
  onRetry,
}) {
  if (isLoading && !selectedGrimoire) {
    return (
      <div className={styles.emptyBox} role="status" aria-live="polite">
        <h2 className={styles.emptyTitle}>Carregando grimórios...</h2>
        <p className={styles.emptyText}>
          Consultando seus grimórios salvos no banco de dados local.
        </p>
      </div>
    );
  }

  if (errorMessage && !selectedGrimoire) {
    return (
      <div className={styles.emptyBox} role="alert">
        <h2 className={styles.emptyTitle}>Erro ao carregar grimórios</h2>
        <p className={styles.emptyText}>{errorMessage}</p>
        <button type="button" className={styles.primaryBtn} onClick={onRetry}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (selectedGrimoire) {
    const spells = Array.isArray(selectedGrimoire.spells)
      ? selectedGrimoire.spells
      : [];

    return (
      <div>
        <section className={styles.detailHeaderCard} aria-label="Detalhes do grimório">
          <div className={styles.detailTopRow}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={onCloseGrimoire}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Voltar para Meus grimórios</span>
            </button>

            <div className={styles.detailActions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={onOpenSpellPicker}
              >
                <Plus size={16} aria-hidden="true" />
                <span>Adicionar magias</span>
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => onOpenEditModal(selectedGrimoire)}
              >
                <Pencil size={15} aria-hidden="true" />
                <span>Editar</span>
              </button>
              <button
                type="button"
                className={styles.dangerOutlineBtn}
                onClick={() => onRequestDeleteGrimoire(selectedGrimoire)}
              >
                <Trash2 size={15} aria-hidden="true" />
                <span>Excluir grimório</span>
              </button>
            </div>
          </div>

          <div>
            <h2 className={styles.detailTitle}>{selectedGrimoire.name}</h2>
            <p className={styles.detailDesc}>
              {selectedGrimoire.description ||
                'Sem descrição cadastrada para este grimório.'}
            </p>
          </div>

          <p className={styles.spellCountBadge}>
            {spells.length} {spells.length === 1 ? 'magia registrada' : 'magias registradas'}
          </p>
        </section>

        {spells.length === 0 ? (
          <div className={styles.emptyBox}>
            <h3 className={styles.emptyTitle}>Este grimório está vazio</h3>
            <p className={styles.emptyText}>
              Adicione magias clicando no botão abaixo ou diretamente a partir
              do buscador e da área de favoritas.
            </p>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={onOpenSpellPicker}
            >
              <Plus size={16} aria-hidden="true" />
              <span>Adicionar magias agora</span>
            </button>
          </div>
        ) : (
          <section className={styles.spellsGrid} aria-label="Magias do grimório">
            {spells.map((spell) => (
              <Card
                key={spell.index}
                spell={spell}
                onInspect={onInspectSpell}
                isFavorite={favoriteIndicesSet.has(spell.index)}
                onToggleFavorite={onToggleFavorite}
                onRemoveFromGrimoire={(targetSpell) =>
                  onRemoveSpellFromGrimoire(selectedGrimoire.id, targetSpell)
                }
              />
            ))}
          </section>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.toolbarTitleGroup}>
          <h2 className={styles.toolbarTitle}>Seus grimórios personalizados</h2>
          <p className={styles.toolbarMeta}>
            {grimoires.length}{' '}
            {grimoires.length === 1 ? 'grimório criado' : 'grimórios criados'}
          </p>
        </div>

        <button
          type="button"
          className={styles.primaryBtn}
          onClick={onOpenCreateModal}
        >
          <Plus size={17} aria-hidden="true" />
          <span>Novo grimório</span>
        </button>
      </div>

      {grimoires.length === 0 ? (
        <div className={styles.emptyBox}>
          <BookMarked size={36} aria-hidden="true" />
          <h3 className={styles.emptyTitle}>Nenhum grimório criado ainda</h3>
          <p className={styles.emptyText}>
            Crie grimórios temáticos (como Suporte, Dano, Controle ou Roleplay)
            para organizar suas magias preferidas no SQLite local.
          </p>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onOpenCreateModal}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Criar primeiro grimório</span>
          </button>
        </div>
      ) : (
        <section className={styles.grimoiresGrid} aria-label="Lista de grimórios">
          {grimoires.map((grimoire) => (
            <article key={grimoire.id} className={styles.grimoireCard}>
              <div className={styles.grimoireCardTop}>
                <div className={styles.tomeEmblem} aria-hidden="true">
                  <BookOpen size={22} />
                </div>
                <div className={styles.grimoireTitleWrap}>
                  <h3 className={styles.grimoireName}>{grimoire.name}</h3>
                  <span className={styles.spellCountBadge}>
                    {grimoire.spell_count}{' '}
                    {grimoire.spell_count === 1 ? 'magia' : 'magias'}
                  </span>
                </div>
              </div>

              {grimoire.description ? (
                <p className={styles.grimoireDesc}>{grimoire.description}</p>
              ) : (
                <p className={styles.grimoireDescEmpty}>Sem descrição.</p>
              )}

              <div className={styles.grimoireActions}>
                <button
                  type="button"
                  className={styles.openBtn}
                  onClick={() => onOpenGrimoire(grimoire.id)}
                  aria-label={`Abrir grimório ${grimoire.name}`}
                >
                  <BookOpen size={15} aria-hidden="true" />
                  <span>Abrir</span>
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => onOpenEditModal(grimoire)}
                  aria-label={`Editar grimório ${grimoire.name}`}
                  title="Editar grimório"
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.iconDangerBtn}
                  onClick={() => onRequestDeleteGrimoire(grimoire)}
                  aria-label={`Excluir grimório ${grimoire.name}`}
                  title="Excluir grimório"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
