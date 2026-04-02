import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import MatchDetail from './pages/MatchDetail.jsx';
import Header from './components/Header.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg-deep">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/match/:fixtureId" element={<MatchDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
