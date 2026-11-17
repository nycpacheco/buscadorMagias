import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import {
  formatSpellLevel,
  getSchoolEmoji,
  normalizeText,
  translateSchool,
} from '../../utils/spellHelpers.js';
import styles from './SpellPickerModal.module.css';

export default function SpellPickerModal({
  isOpen,
  grimoire,
  availableSpells,
  onAddSpell,
  onClose,
}) {
  const [query, setQuery] = useState('');
  const [busyIndex, setBusyIndex] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    setQuery('');
    setErrorMessage('');
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const existingIndices = useMemo(() => {
    const list = Array.isArray(grimoire?.spells) ? grimoire.spells : [];
    return new Set(list.map((s) => s.index));
  }, [grimoire]);

  const filteredSpells = useMemo(() => {
    const norm = normalizeText(query);
    const source = Array.isArray(availableSpells) ? availableSpells : [];
    const matched = norm
      ? source.filter((spell) => normalizeText(spell?.name).includes(norm))
      : source;
    return matched.slice(0, 60);
  }, [availableSpells, query]);

  if (!isOpen || !grimoire) return null;

  async function handleAdd(spell) {
    setBusyIndex(spell.index);
    setErrorMessage('');
    try {
      await onAddSpell(grimoire.id, spell);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Erro ao adicionar magia.'
      );
    } finally {
      setBusyIndex('');
    }
  }

  return (
    <div
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="spell-picker-title"
      >
        <div className={styles.header}>
          <div>
            <p className={styles.subtitle}>Adicionar magias ao grimório</p>
            <h2 id="spell-picker-title" className={styles.title}>
              {grimoire.name}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar seletor de magias"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.searchBar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
            <label htmlFor="picker-search-input" className="sr-only">
              Buscar magia para adicionar ao grimório
            </label>
            <input
              id="picker-search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar magia pelo nome..."
              className={styles.searchInput}
              autoFocus
            />
          </div>
        </div>

        <div className={styles.body}>
          {errorMessage && (
            <p className={styles.errorBox} role="alert">
              {errorMessage}
            </p>
          )}

          {filteredSpells.length === 0 ? (
            <p className={styles.emptyText}>
              Nenhuma magia disponível encontrada para "{query}".
            </p>
          ) : (
            filteredSpells.map((spell) => {
              const alreadyIn = existingIndices.has(spell.index);
              const isBusy = busyIndex === spell.index;
              return (
                <div key={spell.index} className={styles.spellRow}>
                  <div className={styles.spellLeft}>
                    <span className={styles.emoji} aria-hidden="true">
                      {getSchoolEmoji(spell)}
                    </span>
                    <div>
                      <p className={styles.spellName}>{spell.name}</p>
                      <p className={styles.spellMeta}>
                        {translateSchool(spell.school)} ·{' '}
                        {formatSpellLevel(spell.level)}
                      </p>
                    </div>
                  </div>
                  {alreadyIn ? (
                    <span className={styles.addedTag}>
                      <Check size={14} aria-hidden="true" />
                      <span>Já adicionada</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={styles.addBtn}
                      disabled={isBusy}
                      onClick={() => handleAdd(spell)}
                      aria-label={`Adicionar ${spell.name} a ${grimoire.name}`}
                    >
                      <Plus size={14} aria-hidden="true" />
                      <span>{isBusy ? 'Adicionando...' : 'Adicionar'}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
