import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-bg-deep/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-cyan-violet flex items-center justify-center shadow-cyan-glow">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-text-primary group-hover:text-accent-cyan transition-colors">
              FootScout <span className="text-accent-cyan">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-result-win animate-pulse-slow" />
              Live Analysis
            </span>
            <a
              href="https://api-football-v1.p.rapidapi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:block text-xs text-text-muted hover:text-accent-cyan transition-colors"
            >
              API-Football
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
