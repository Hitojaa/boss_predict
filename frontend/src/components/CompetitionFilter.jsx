import React from 'react';

const filters = [
  { key: 'all', label: 'Tous les matchs', icon: '⚽' },
  { key: 'ucl', label: 'Champions League', icon: '🏆' },
  { key: 'worldcup', label: 'Coupe du Monde', icon: '🌍' },
];

export default function CompetitionFilter({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(f => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
            border transition-all duration-200
            ${active === f.key
              ? 'bg-accent-cyan/10 border-accent-cyan text-accent-cyan shadow-cyan-glow'
              : 'bg-bg-card border-white/10 text-text-secondary hover:border-accent-cyan/40 hover:text-text-primary'
            }
          `}
        >
          <span>{f.icon}</span>
          <span>{f.label}</span>
        </button>
      ))}
    </div>
  );
}
