import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './DashboardHeader.css';
import SaniTapLogo from '../assets/SaniTapLogo.png'; // Import the logo

export default function DashboardHeader() {
  const location = useLocation();

  return (
    <header className="dashboard-header">
      <div className="header-container">
        <div className="logo">
          <img 
            src={SaniTapLogo} 
            alt="SaniTap" 
            className="logo-image"
          />
          {/* Removed the <h1>SaniTap</h1> text */}
        </div>
        
        <nav className="header-nav">
          <Link 
            to="/"
            href="/"
            className={`nav-button ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/list"
            href="/list"
            className={`nav-button ${location.pathname === '/list' ? 'active' : ''}`}
          >
            List
          </Link>
          <button className="profile-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
        </nav>
      </div>
    </header>
  );
}