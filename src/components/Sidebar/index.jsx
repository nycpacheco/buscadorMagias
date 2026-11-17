import { BookMarked, Search, Sparkles, Star } from 'lucide-react';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  {
    id: 'search',
    label: 'Pesquisar magias',
    shortLabel: 'Pesquisar',
    icon: Search,
  },
  {
    id: 'favorites',
    label: 'Favoritas',
    shortLabel: 'Favoritas',
    icon: Star,
  },
  {
    id: 'grimoires',
    label: 'Meus grimórios',
    shortLabel: 'Grimórios',
    icon: BookMarked,
  },
];

export default function Sidebar({
  activeTab,
  onSelectTab,
  totalSpellsCount,
  favoritesCount,
  grimoiresCount,
}) {
  const counts = {
    search: totalSpellsCount,
    favorites: favoritesCount,
    grimoires: grimoiresCount,
  };

  return (
    <>
      <aside className={styles.sidebar} aria-label="Navegação lateral">
        <div className={styles.brandBlock}>
          <div className={styles.brandEmblem} aria-hidden="true">
            <Sparkles size={20} />
          </div>
          <div className={styles.brandTextWrap}>
            <p className={styles.brandTitle}>Grimório Arcano</p>
            <p className={styles.brandSub}>Biblioteca Pessoal D&amp;D 5e</p>
          </div>
        </div>

        <nav className={styles.navList} aria-label="Áreas principais">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const count = counts[item.id];

            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.navButton} ${
                  isActive ? styles.navButtonActive : ''
                }`}
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={styles.navLeft}>
                  <Icon size={18} className={styles.navIcon} aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {typeof count === 'number' && (
                  <span className={styles.countBadge}>{count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <p className={styles.sidebarFooterNote}>
          Favoritas e grimórios são salvos localmente no banco SQLite3 para
          consulta mesmo sem acesso à API externa.
        </p>
      </aside>

      <div className={styles.mobileBar}>
        <div className={styles.mobileHeader}>
          <div className={styles.mobileBrand}>
            <div className={styles.brandEmblem} aria-hidden="true">
              <Sparkles size={18} />
            </div>
            <div>
              <p className={styles.brandTitle}>Grimório Arcano</p>
              <p className={styles.brandSub}>Biblioteca Pessoal D&amp;D 5e</p>
            </div>
          </div>
        </div>

        <nav className={styles.mobileNavTabs} aria-label="Navegação móvel">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const count = counts[item.id];

            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.mobileTabBtn} ${
                  isActive ? styles.mobileTabBtnActive : ''
                }`}
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={17} aria-hidden="true" />
                <span>
                  {item.shortLabel}
                  {typeof count === 'number' ? ` (${count})` : ''}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
