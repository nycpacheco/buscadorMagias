import { useEffect, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import styles from './AddToGrimoireModal.module.css';

export default function AddToGrimoireModal({
  spell,
  grimoires,
  membershipMap,
  onAddSpell,
  onRemoveSpell,
  onCreateGrimoire,
  onClose,
}) {
  const [busyGrimoireId, setBusyGrimoireId] = useState(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!spell) return undefined;
    setErrorMessage('');
    setNewName('');
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spell, onClose]);

  if (!spell) return null;

  const spellGrimoireIds = new Set(membershipMap[spell.index] || []);

  async function handleToggle(grimoire) {
    setBusyGrimoireId(grimoire.id);
    setErrorMessage('');
    try {
      if (spellGrimoireIds.has(grimoire.id)) {
        await onRemoveSpell(grimoire.id, spell.index);
      } else {
        await onAddSpell(grimoire.id, spell);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Erro ao atualizar grimório.'
      );
    } finally {
      setBusyGrimoireId(null);
    }
  }

  async function handleQuickCreate(event) {
    event.preventDefault();
    const clean = newName.trim();
    if (!clean) {
      setErrorMessage('Digite um nome para o novo grimório.');
      return;
    }
    setCreating(true);
    setErrorMessage('');
    try {
      const created = await onCreateGrimoire({ name: clean, description: '' });
      if (created?.id) {
        await onAddSpell(created.id, spell);
      }
      setNewName('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Erro ao criar grimório.'
      );
    } finally {
      setCreating(false);
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
        aria-labelledby="add-to-grimoire-title"
      >
        <div className={styles.header}>
          <div>
            <p className={styles.subtitle}>Gerenciar grimórios da magia</p>
            <h2 id="add-to-grimoire-title" className={styles.title}>
              {spell.name}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar seleção de grimórios"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.body}>
          {errorMessage && (
            <p className={styles.errorBox} role="alert">
              {errorMessage}
            </p>
          )}

          {grimoires.length === 0 ? (
            <p className={styles.emptyBox}>
              Você ainda não criou nenhum grimório. Crie um abaixo para
              adicionar esta magia imediatamente.
            </p>
          ) : (
            <div className={styles.grimoireList}>
              {grimoires.map((grimoire) => {
                const isMember = spellGrimoireIds.has(grimoire.id);
                const isBusy = busyGrimoireId === grimoire.id;
                return (
                  <div key={grimoire.id} className={styles.grimoireRow}>
                    <div className={styles.grimoireInfo}>
                      <p className={styles.grimoireName}>{grimoire.name}</p>
                      <p className={styles.grimoireMeta}>
                        {grimoire.spell_count}{' '}
                        {grimoire.spell_count === 1 ? 'magia' : 'magias'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={
                        isMember ? styles.addedBadgeBtn : styles.addBtn
                      }
                      disabled={isBusy}
                      onClick={() => handleToggle(grimoire)}
                      aria-label={
                        isMember
                          ? `Remover ${spell.name} de ${grimoire.name}`
                          : `Adicionar ${spell.name} a ${grimoire.name}`
                      }
                    >
                      {isMember ? (
                        <>
                          <Check size={15} aria-hidden="true" />
                          <span>No grimório</span>
                          <Trash2 size={14} aria-hidden="true" />
                        </>
                      ) : (
                        <>
                          <Plus size={15} aria-hidden="true" />
                          <span>Adicionar</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.quickCreateBox}>
            <label htmlFor="quick-grimoire-name" className={styles.quickCreateTitle}>
              Criar novo grimório e já adicionar esta magia
            </label>
            <form className={styles.quickForm} onSubmit={handleQuickCreate}>
              <input
                id="quick-grimoire-name"
                type="text"
                maxLength={100}
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Nome do novo grimório..."
                className={styles.quickInput}
              />
              <button
                type="submit"
                className={styles.addBtn}
                disabled={creating}
              >
                <Plus size={15} aria-hidden="true" />
                <span>{creating ? 'Criando...' : 'Criar e adicionar'}</span>
              </button>
            </form>
          </div>
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
