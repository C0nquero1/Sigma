import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Website from './pages/Website';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    // When not logged in, show the beautiful new landing page
    return <Website onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // Once logged in, reveal the command deck
  return <Dashboard />;
}