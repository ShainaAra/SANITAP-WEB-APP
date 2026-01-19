import React from 'react';
import './StatCard.css';

export default function StatCard({ title, value, date }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-date">{date}</p>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
