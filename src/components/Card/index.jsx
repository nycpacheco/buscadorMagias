import { BookPlus, Star, Trash2 } from "lucide-react";
import {
  formatCastingTime,
  formatDescriptionSummary,
  formatRange,
  formatSpellLevel,
  getSchoolEmoji,
  translateSchool,
} from "../../utils/spellHelpers.js";
import styles from "./Card.module.css";

export default function SpellCard({
  spell,
  onInspect,
  isFavorite = false,
  onToggleFavorite,
  grimoireCount = 0,
  onOpenAddToGrimoire,
  onRemoveFromGrimoire,
}) {
  const schoolEmoji = getSchoolEmoji(spell);
  const name = spell?.name || "Magia sem nome";
  const schoolName = translateSchool(spell?.school);
  const levelLabel = formatSpellLevel(spell?.level);
  const castingTime = formatCastingTime(spell?.casting_time);
  const range = formatRange(spell?.range);
  const summary = formatDescriptionSummary(spell?.desc);

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.emblemWrap} aria-hidden="true">
          <span className={styles.emblemEmoji}>{schoolEmoji}</span>
        </div>

        <div className={styles.titleBlock}>
          <p className={styles.metaLine}>
            <span>{schoolName}</span>
            <span aria-hidden="true">·</span>
            <span className={styles.levelText}>{levelLabel}</span>
          </p>
          <h2 className={styles.title}>{name}</h2>
        </div>

        {onToggleFavorite && (
          <button
            type="button"
            className={`${styles.favoriteButton} ${
              isFavorite ? styles.favoriteButtonActive : ""
            }`}
            onClick={() => onToggleFavorite(spell)}
            aria-label={
              isFavorite
                ? `Remover ${name} dos favoritos`
                : `Favoritar ${name}`
            }
            aria-pressed={isFavorite}
            title={isFavorite ? "Remover dos favoritos" : "Favoritar magia"}
          >
            <Star
              size={18}
              fill={isFavorite ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      <dl className={styles.specsGrid}>
        <div className={styles.specItem}>
          <dt className={styles.specLabel}>Conjuração</dt>
          <dd className={styles.specValue}>{castingTime}</dd>
        </div>
        <div className={styles.specItem}>
          <dt className={styles.specLabel}>Alcance</dt>
          <dd className={styles.specValue}>{range}</dd>
        </div>
      </dl>

      <p className={styles.summary}>{summary}</p>

      <div className={styles.cardFooter}>
        <button
          type="button"
          className={styles.detailButton}
          onClick={() => onInspect(spell)}
          aria-label={`Detalhar ${name}`}
        >
          Detalhar
        </button>

        {onOpenAddToGrimoire && (
          <button
            type="button"
            className={styles.grimoireActionButton}
            onClick={() => onOpenAddToGrimoire(spell)}
            aria-label={`Adicionar ${name} a um grimório`}
          >
            <BookPlus size={16} aria-hidden="true" />
            <span>
              {grimoireCount > 0 ? `Grimórios (${grimoireCount})` : "Grimório"}
            </span>
          </button>
        )}

        {onRemoveFromGrimoire && (
          <button
            type="button"
            className={styles.removeFromGrimoireButton}
            onClick={() => onRemoveFromGrimoire(spell)}
            aria-label={`Remover ${name} do grimório`}
          >
            <Trash2 size={15} aria-hidden="true" />
            <span>Remover</span>
          </button>
        )}
      </div>
    </article>
  );
}
