import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './DashboardHeader.css';
import SaniTapLogo from '../assets/SaniTapLogo.png';
import NotificationBell from "../components/NotificationBell";

export default function DashboardHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const admin = JSON.parse(localStorage.getItem("admin") || "null");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="dashboard-header">
      <div className="header-container">
        <div className="logo">
          <img
            src={SaniTapLogo}
            alt="SaniTap"
            className="logo-image"
          />
        </div>

        <nav className="header-nav">
          <Link
            to="/"
            className={`nav-button ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>

          <Link
            to="/list"
            className={`nav-button ${location.pathname === '/list' ? 'active' : ''}`}
          >
            List
          </Link>

          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>

          <div className="profile-menu-wrapper" ref={menuRef}>
            <button
              className="profile-button"
              onClick={() => setMenuOpen((prev) => !prev)}
              title="Account"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>

            {menuOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-avatar">
                    {admin?.username?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div className="profile-info">
                    <div className="profile-name">
                      {admin?.username || "Admin"}
                    </div>
                    <div className="profile-role">Authenticated Admin</div>
                  </div>
                </div>

                <div className="profile-dropdown-divider" />

                <button
                  className="profile-dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}