import styles from './Header.module.css';

export default function Header({
  kicker = 'Compêndio Arcano · D&D 5ª Edição',
  title = 'Grimório de Magias',
  subtitle = 'Consulte, pesquise e filtre todas as magias da 5ª Edição por escola, nível, tempo de conjuração e tipo de dano com carregamento instantâneo.',
  countValue = null,
  countLabel = 'magias catalogadas',
}) {
  return (
    <header className={styles.header}>
      <div className={styles.bannerCard}>
        <p className={styles.kicker}>{kicker}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        {typeof countValue === 'number' && countValue > 0 && (
          <p className={styles.catalogMeta}>
            <span className={styles.countNumber}>{countValue}</span> {countLabel}
          </p>
        )}
      </div>
    </header>
  );
}
