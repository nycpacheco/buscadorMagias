import { useEffect, useRef } from "react";
import { BookPlus, Star, X } from "lucide-react";
import {
  formatAreaOfEffect,
  formatAttackType,
  formatCastingTime,
  formatComponents,
  formatDuration,
  formatRange,
  formatSavingThrow,
  formatSpellLevel,
  getSchoolEmoji,
  getSpellScaling,
  normalizeDamageEntries,
  translateClass,
  translateSchool,
  translateSubclass,
} from "../../utils/spellHelpers.js";
import styles from "./CardModal.module.css";

export default function SpellModal({
  spell,
  onClose,
  isFavorite = false,
  onToggleFavorite,
  onOpenAddToGrimoire,
}) {
  const closeButtonRef = useRef(null);
  const schoolEmoji = getSchoolEmoji(spell);

  useEffect(() => {
    if (!spell) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [spell, onClose]);

  if (!spell) {
    return null;
  }

  const name = spell?.name || "Detalhes da Magia";
  const schoolName = translateSchool(spell?.school);
  const levelLabel = formatSpellLevel(spell?.level);
  const castingTime = formatCastingTime(spell?.casting_time);
  const range = formatRange(spell?.range);
  const duration = formatDuration(spell?.duration);

  const components = formatComponents(spell?.components);
  const material =
    typeof spell?.material === "string" && spell.material.trim()
      ? spell.material.trim()
      : null;

  const attackType = formatAttackType(spell?.attack_type);
  const savingThrowText = formatSavingThrow(spell?.dc);
  const areaOfEffect = formatAreaOfEffect(spell?.area_of_effect);

  const descriptions = Array.isArray(spell?.desc)
    ? spell.desc.filter((line) => typeof line === "string" && line.trim())
    : [];

  const damageEntries = normalizeDamageEntries(spell);
  const scaling = getSpellScaling(spell);

  const classes = Array.isArray(spell?.classes)
    ? spell.classes.filter(
        (cls) => typeof cls?.name === "string" && cls.name.trim(),
      )
    : [];
  const subclasses = Array.isArray(spell?.subclasses)
    ? spell.subclasses.filter(
        (sub) => typeof sub?.name === "string" && sub.name.trim(),
      )
    : [];

  const metaTraits = [schoolName, levelLabel];
  if (spell?.ritual === true) metaTraits.push("Ritual");
  if (spell?.concentration === true) metaTraits.push("Concentração");

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
        aria-labelledby="spell-modal-title"
      >
        <div className={styles.modalHeader}>
          <div className={styles.headerIdentity}>
            <div className={styles.emblemBox} aria-hidden="true">
              <span className={styles.emblemEmoji}>{schoolEmoji}</span>
            </div>

            <div className={styles.titleWrap}>
              <p className={styles.metaTraits}>
                {metaTraits.map((trait, index) => (
                  <span key={trait} className={styles.metaItem}>
                    {index > 0 && (
                      <span className={styles.metaSep} aria-hidden="true">
                        ·
                      </span>
                    )}
                    <span>{trait}</span>
                  </span>
                ))}
              </p>
              <h2 id="spell-modal-title" className={styles.title}>
                {name}
              </h2>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar detalhes da magia"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.modalBody}>
          <section
            className={styles.section}
            aria-label="Propriedades da magia"
          >
            <dl className={styles.propertiesGrid}>
              <div className={styles.propertyItem}>
                <dt className={styles.propertyLabel}>Tempo de conjuração</dt>
                <dd className={styles.propertyValue}>{castingTime}</dd>
              </div>
              <div className={styles.propertyItem}>
                <dt className={styles.propertyLabel}>Alcance</dt>
                <dd className={styles.propertyValue}>{range}</dd>
              </div>
              <div className={styles.propertyItem}>
                <dt className={styles.propertyLabel}>Duração</dt>
                <dd className={styles.propertyValue}>{duration}</dd>
              </div>
              {components.length > 0 && (
                <div className={styles.propertyItem}>
                  <dt className={styles.propertyLabel}>Componentes</dt>
                  <dd className={styles.propertyValue}>
                    {components.join(", ")}
                  </dd>
                </div>
              )}
              {attackType && (
                <div className={styles.propertyItem}>
                  <dt className={styles.propertyLabel}>Tipo de ataque</dt>
                  <dd className={styles.propertyValue}>{attackType}</dd>
                </div>
              )}
              {savingThrowText && (
                <div className={styles.propertyItem}>
                  <dt className={styles.propertyLabel}>Salvaguarda</dt>
                  <dd className={styles.propertyValue}>{savingThrowText}</dd>
                </div>
              )}
              {areaOfEffect && (
                <div className={styles.propertyItem}>
                  <dt className={styles.propertyLabel}>Área de efeito</dt>
                  <dd className={styles.propertyValue}>{areaOfEffect}</dd>
                </div>
              )}
            </dl>

            {material && (
              <p className={styles.materialNote}>
                <strong>Componente material:</strong> {material}
              </p>
            )}
          </section>

          {descriptions.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Descrição</h3>
              <div className={styles.prose}>
                {descriptions.map((paragraph, index) => (
                  <p key={index} className={styles.paragraph}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          )}

          {damageEntries.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Dano da magia</h3>
              <div className={styles.damageList}>
                {damageEntries.map((entry, idx) => (
                  <div
                    key={`${entry.damageTypeIndex || "dmg"}-${idx}`}
                    className={styles.damageRow}
                  >
                    <span className={styles.damageType}>
                      {entry.damageTypeLabel || "Dano mágico"}
                    </span>
                    {entry.baseDice && (
                      <span className={styles.damageDice}>
                        {entry.baseDice}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {scaling && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Escalonamento</h3>

              {scaling.damageTables.map((table, idx) => (
                <div key={idx} className={styles.scaleBlock}>
                  <h4 className={styles.scaleSubtitle}>{table.title}</h4>
                  <div className={styles.scaleGrid}>
                    {table.rows.map((row) => (
                      <div key={row.levelKey} className={styles.scaleCell}>
                        <span className={styles.scaleKey}>{row.label}</span>
                        <span className={styles.scaleVal}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {scaling.healRows.length > 0 && (
                <div className={styles.scaleBlock}>
                  <h4 className={styles.scaleSubtitle}>
                    Cura por espaço de magia
                  </h4>
                  <div className={styles.scaleGrid}>
                    {scaling.healRows.map((row) => (
                      <div key={row.levelKey} className={styles.scaleCell}>
                        <span className={styles.scaleKey}>{row.label}</span>
                        <span className={styles.scaleVal}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scaling.higherLevelNotes.length > 0 && (
                <div className={styles.prose}>
                  {scaling.higherLevelNotes.map((note, idx) => (
                    <p key={idx} className={styles.paragraph}>
                      {note}
                    </p>
                  ))}
                </div>
              )}
            </section>
          )}

          {(classes.length > 0 || subclasses.length > 0) && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Classes conjuradoras</h3>
              {classes.length > 0 && (
                <p className={styles.classText}>
                  <strong>Classes:</strong>{" "}
                  {classes.map((cls) => translateClass(cls)).join(", ")}
                </p>
              )}
              {subclasses.length > 0 && (
                <p className={styles.classText}>
                  <strong>Subclasses:</strong>{" "}
                  {subclasses.map((sub) => translateSubclass(sub)).join(", ")}
                </p>
              )}
            </section>
          )}
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.footerActions}>
            {onToggleFavorite && (
              <button
                type="button"
                className={`${styles.footerSecondaryButton} ${
                  isFavorite ? styles.footerFavoriteActive : ""
                }`}
                onClick={() => onToggleFavorite(spell)}
              >
                <Star
                  size={16}
                  fill={isFavorite ? "currentColor" : "none"}
                  aria-hidden="true"
                />
                <span>{isFavorite ? "Favoritada" : "Favoritar"}</span>
              </button>
            )}
            {onOpenAddToGrimoire && (
              <button
                type="button"
                className={styles.footerSecondaryButton}
                onClick={() => onOpenAddToGrimoire(spell)}
              >
                <BookPlus size={16} aria-hidden="true" />
                <span>Adicionar a grimório</span>
              </button>
            )}
          </div>

          <button
            type="button"
            className={styles.footerCloseButton}
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
