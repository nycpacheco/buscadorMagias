import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  note,
  confirmLabel = 'Excluir',
  isSubmitting = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onCancel();
        }
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <AlertTriangle size={20} className={styles.warnIcon} aria-hidden="true" />
            <h2 id="confirm-dialog-title" className={styles.title}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Fechar confirmação"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.message}>{message}</p>
          {note && <p className={styles.note}>{note}</p>}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.dangerBtn}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Excluindo...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
