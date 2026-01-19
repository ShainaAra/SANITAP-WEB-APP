import React from 'react';
import './DashboardHeader.css';

export default function DashboardHeader() {
  return (
    <header className="dashboard-header">
      <div className="header-container">
        <div className="logo">
          <h1>SaniTap</h1>
        </div>
        
        <nav className="header-nav">
          <button className="nav-button active">Home</button>
          <button className="nav-button">List</button>
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
