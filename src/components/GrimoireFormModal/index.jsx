import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import styles from './GrimoireFormModal.module.css';

export default function GrimoireFormModal({
  isOpen,
  mode = 'create',
  initialGrimoire = null,
  isSubmitting = false,
  onSubmit,
  onClose,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(initialGrimoire?.name || '');
    setDescription(initialGrimoire?.description || '');
    setErrorMessage('');
  }, [isOpen, initialGrimoire]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage('Informe um nome para o grimório.');
      return;
    }

    setErrorMessage('');
    try {
      await onSubmit({
        name: cleanName,
        description: description.trim(),
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Erro ao salvar grimório.'
      );
    }
  }

  return (
    <div
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="grimoire-form-title"
      >
        <div className={styles.header}>
          <h2 id="grimoire-form-title" className={styles.title}>
            {mode === 'edit' ? 'Editar Grimório' : 'Novo Grimório'}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar formulário de grimório"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>
            {errorMessage && (
              <p className={styles.errorBox} role="alert">
                {errorMessage}
              </p>
            )}

            <div className={styles.fieldGroup}>
              <label htmlFor="grimoire-name-input" className={styles.label}>
                Nome do grimório *
              </label>
              <input
                id="grimoire-name-input"
                type="text"
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Grimório de Controle, Magias de Suporte..."
                className={styles.input}
                autoFocus
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="grimoire-desc-input" className={styles.label}>
                Descrição (opcional)
              </label>
              <textarea
                id="grimoire-desc-input"
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descreva a finalidade ou personagem associado a este grimório..."
                className={styles.textarea}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Salvando...'
                : mode === 'edit'
                  ? 'Salvar alterações'
                  : 'Criar grimório'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
