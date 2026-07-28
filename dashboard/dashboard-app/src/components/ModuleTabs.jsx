/**
 * Tab bar for switching between registered data modules. Purely presentational
 * — the list of modules comes from the registry, so adding a new module
 * automatically adds a new tab here with zero changes to this file.
 */
export default function ModuleTabs({ modules, activeId, onSelect }) {
  if (!modules || modules.length < 2) return null

  return (
    <nav className="module-tabs" aria-label="Data modules">
      {modules.map(m => (
        <button
          key={m.id}
          className={`module-tab ${m.id === activeId ? 'active' : ''}`}
          onClick={() => onSelect(m.id)}
        >
          <span className="module-tab-icon">{m.icon}</span>
          {m.label}
        </button>
      ))}
    </nav>
  )
}
