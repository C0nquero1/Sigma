import React, { useState } from 'react';
import Website from './pages/Website';
import AuthPage from './components/AuthPage';
import Dashboard from './pages/Dashboard'; 

export default function App() {
  // 'landing' | 'login' | 'signup' | 'platform'
  const [currentPage, setCurrentPage] = useState('landing');

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      
      {/* 1. The Operated Website */}
      {currentPage === 'landing' && <Website onNavigate={setCurrentPage} />}
      
      {/* 2. The Auth Flow */}
      {(currentPage === 'login' || currentPage === 'signup') && (
        <AuthPage 
          initialMode={currentPage} 
          onNavigate={setCurrentPage} 
        />
      )}
      
      {/* 3. The Master Intelligence Platform */}
      {currentPage === 'platform' && <Dashboard onNavigate={setCurrentPage} />}
      
    </div>
  );
}