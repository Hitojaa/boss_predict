import React from 'react';
import { Link } from 'react-router-dom';
import WinProbability from './WinProbability.jsx';
import TeamForm from './TeamForm.jsx';

function LeagueBadge({ leagueKey, leagueName }) {
  const isUCL = leagueKey === 'ucl';
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
      ${isUCL
        ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/30'
        : 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
      }
    `}>
      {isUCL ? '🏆' : '🌍'} {leagueName}
    </span>
  );
}

function TeamDisplay({ team, reverse = false }) {
  return (
    <div className={`flex items-center gap-3 ${reverse ? 'flex-row-reverse' : ''}`}>
      {team?.logo ? (
        <img
          src={team.logo}
          alt={team.name}
          className="w-12 h-12 object-contain drop-shadow-lg"
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-bg-surface flex items-center justify-center text-lg">
          ⚽
        </div>
      )}
      <div className={reverse ? 'text-right' : ''}>
        <p className="font-display font-bold text-text-primary text-sm sm:text-base leading-tight">
          {team?.name || 'TBD'}
        </p>
        {team?.country && (
          <p className="text-xs text-text-muted">{team.country}</p>
        )}
      </div>
    </div>
  );
}

export default function MatchCard({ match, analysis }) {
  const { fixture, teams, league, leagueKey, leagueName } = match;
  const matchDate = new Date(fixture?.date);
  const isHighValue = analysis && (
    Math.max(
      analysis.win_probability?.home || 0,
      analysis.win_probability?.away || 0
    ) > 65
  );

  const formattedDate = matchDate.toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
  const formattedTime = matchDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <Link to={`/match/${fixture.id}`} className="block group">
      <article className="card p-4 sm:p-5 hover:border-accent-cyan/30 transition-all duration-300 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <LeagueBadge leagueKey={leagueKey} leagueName={leagueName} />
          <div className="flex items-center gap-2">
            {isHighValue && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-result-win/20 text-result-win border border-result-win/30 animate-pulse-slow">
                HIGH VALUE
              </span>
            )}
            <div className="text-right">
              <p className="text-xs text-text-muted">{formattedDate}</p>
              <p className="font-mono text-sm font-semibold text-accent-cyan">{formattedTime}</p>
            </div>
          </div>
        </div>

        {/* Teams */}
        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center mb-4">
          <TeamDisplay team={teams?.home} />
          <div className="text-center">
            <div className="font-display font-bold text-xl text-text-muted">VS</div>
            {fixture?.venue?.name && (
              <p className="text-xs text-text-muted mt-1 hidden sm:block truncate max-w-[80px]">
                {fixture.venue.name}
              </p>
            )}
          </div>
          <TeamDisplay team={teams?.away} reverse />
        </div>

        {/* Recent form */}
        <div className="flex justify-between items-center mb-4 px-1">
          <div>
            <p className="text-xs text-text-muted mb-1">Forme récente</p>
            <TeamForm form={match.homeForm} />
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted mb-1">Forme récente</p>
            <TeamForm form={match.awayForm} />
          </div>
        </div>

        {/* Win probability */}
        {analysis?.win_probability ? (
          <div>
            <WinProbability
              home={analysis.win_probability.home}
              draw={analysis.win_probability.draw}
              away={analysis.win_probability.away}
              compact
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-2 h-2 rounded-full bg-accent-cyan/40" />
            <span>Cliquer pour générer l'analyse IA</span>
          </div>
        )}

        {/* CTA hint */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {fixture?.venue?.city && `📍 ${fixture.venue.city}`}
          </span>
          <span className="text-xs text-accent-cyan group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-1">
            Analyser →
          </span>
        </div>
      </article>
    </Link>
  );
}

// Skeleton loader for MatchCard
export function MatchCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="skeleton h-5 w-32 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="skeleton w-12 h-12 rounded-full" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
        <div className="skeleton h-6 w-8 rounded" />
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className="skeleton w-12 h-12 rounded-full" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
      </div>
      <div className="skeleton h-3 rounded-full mb-2" />
      <div className="flex justify-between">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    </div>
  );
}
