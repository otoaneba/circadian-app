import React from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import Logging from '../Logging/Logging';
import Profile from '../Profile/Profile';
import './Overview.css';

const Overview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getHeaderLogo = () => {
    switch (location.pathname) {
      case '/logging':
        return (
          <>
            <svg viewBox="0 0 24 24" className="header-logo">
              <path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <h3>Logging</h3>
          </>
        );
      case '/profile':
        return (
          <>      
            <svg viewBox="0 0 24 24" className="header-logo">
              <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <h3>Profile</h3>
          </>
        );
      default:
        return (
          <>
            <svg viewBox="0 0 24 24" className="header-logo">
              <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            <h3>Overview</h3>
          </>
        );
    }
  };
  
  return (
    <div className="overview-wrapper">
      <nav className="side-nav">
        <div className="logo">
          {getHeaderLogo()} 
        </div>
        <div 
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
          Overview
        </div>
        <div 
          className={`nav-item ${location.pathname === '/logging' ? 'active' : ''}`}
          onClick={() => navigate('/logging')}
        >
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          Log
        </div>
        <div 
          className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          Profile
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<div>Overview Content</div>} />
          <Route path="/logging" element={<Logging />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
};

export default Overview;