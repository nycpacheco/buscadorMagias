import { RotateCcw, Search, X } from 'lucide-react';
import styles from './Filter.module.css';

export default function FilterBar({
  filters,
  options,
  onFilterChange,
  onResetFilters,
  filteredCount,
  totalCount,
}) {
  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    Boolean(filters.school) ||
    Boolean(filters.level) ||
    Boolean(filters.castingTime) ||
    Boolean(filters.damageType);

  return (
    <section className={styles.panel} aria-label="Pesquisa e filtros de magias">
      <div className={styles.searchRow}>
        <div className={styles.searchField}>
          <label htmlFor="spell-search-input" className={styles.fieldLabel}>
            Pesquisar por nome
          </label>
          <div className={styles.searchInputWrap}>
            <Search size={18} className={styles.searchIcon} aria-hidden="true" />
            <input
              id="spell-search-input"
              type="search"
              value={filters.search}
              onChange={(event) => onFilterChange('search', event.target.value)}
              placeholder="Ex.: Bola de Fogo, Escudo Arcano, Raio de Fogo..."
              className={styles.searchInput}
              autoComplete="off"
            />
            {filters.search && (
              <button
                type="button"
                className={styles.clearSearchButton}
                onClick={() => onFilterChange('search', '')}
                aria-label="Limpar busca por nome"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.filtersGrid}>
        <div className={styles.selectGroup}>
          <label htmlFor="filter-school" className={styles.fieldLabel}>
            Escola de magia
          </label>
          <select
            id="filter-school"
            value={filters.school}
            onChange={(event) => onFilterChange('school', event.target.value)}
            className={styles.select}
          >
            <option value="">Todas as escolas</option>
            {options.schools.map((school) => (
              <option key={school.value} value={school.value}>
                {school.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label htmlFor="filter-level" className={styles.fieldLabel}>
            Nível da magia
          </label>
          <select
            id="filter-level"
            value={filters.level}
            onChange={(event) => onFilterChange('level', event.target.value)}
            className={styles.select}
          >
            <option value="">Todos os níveis</option>
            {options.levels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label htmlFor="filter-casting-time" className={styles.fieldLabel}>
            Tempo de conjuração
          </label>
          <select
            id="filter-casting-time"
            value={filters.castingTime}
            onChange={(event) =>
              onFilterChange('castingTime', event.target.value)
            }
            className={styles.select}
          >
            <option value="">Todos os tempos</option>
            {options.castingTimes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label htmlFor="filter-damage-type" className={styles.fieldLabel}>
            Tipo de dano
          </label>
          <select
            id="filter-damage-type"
            value={filters.damageType}
            onChange={(event) => onFilterChange('damageType', event.target.value)}
            className={styles.select}
          >
            <option value="">Todos os tipos</option>
            <option value="__none__">Sem dano direto</option>
            {options.damageTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.footerBar}>
        <p className={styles.resultsText} aria-live="polite">
          Exibindo{' '}
          <strong className={styles.resultsNumber}>{filteredCount}</strong> de{' '}
          <strong className={styles.resultsNumber}>{totalCount}</strong> magias
        </p>

        {hasActiveFilters && (
          <button
            type="button"
            className={styles.resetButton}
            onClick={onResetFilters}
          >
            <RotateCcw size={15} aria-hidden="true" />
            <span>Limpar filtros</span>
          </button>
        )}
      </div>
    </section>
  );
}
