import React, { useState } from 'react';
import './ListTable.css';
import { Checkbox } from './ui/checkbox';

export default function ListTable({ students, onClearBalance }) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isClearing, setIsClearing] = useState(false);

  const handleRowCheckboxChange = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === students.length && students.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(students.map((_, index) => index)));
    }
  };

  const handleClearBalance = async () => {
    if (selectedRows.size === 0) return;
    
    // Get the selected students
    const selectedStudents = Array.from(selectedRows).map(index => students[index]);
    
    // Check for users with zero balance
    const zeroBalanceUsers = selectedStudents.filter(student => {
      // Remove '₱ ' and parse as float
      const paymentValue = parseFloat(student.totalPayment.replace('₱ ', ''));
      return paymentValue === 0;
    });

    if (zeroBalanceUsers.length > 0) {
      const userNames = zeroBalanceUsers.map(user => user.name).join(', ');
      alert(`The following users already have zero balance:\n${userNames}\n\nPlease uncheck them and try again.`);
      return;
    }

    // Confirm with user
    if (!window.confirm(`Clear balance for ${selectedRows.size} selected user(s)?`)) {
      return;
    }

    setIsClearing(true);
    try {
      // Call the parent component's handler
      await onClearBalance(selectedStudents);
      // Clear selection after successful operation
      setSelectedRows(new Set());
    } catch (error) {
      console.error('Error clearing balances:', error);
      alert('Failed to clear balances. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  // Helper function to check if a student has zero balance
  const hasZeroBalance = (student) => {
    const paymentValue = parseFloat(student.totalPayment.replace('₱ ', ''));
    return paymentValue === 0;
  };

  return (
    <div className="list-table-container">
      {selectedRows.size > 0 && (
        <div className="table-actions">
          <button 
            className="clear-balance-button" 
            onClick={handleClearBalance}
            disabled={isClearing}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            {isClearing ? 'Clearing...' : `Clear Balance (${selectedRows.size})`}
          </button>
        </div>
      )}
      <div className="list-table-wrapper">
        <table className="list-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                {students.length > 0 && (
                  <Checkbox
                    checked={selectedRows.size === students.length && students.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                )}
              </th>
              <th>RFID Number</th>
              <th>ID Number</th>
              <th>Name</th>
              <th>Course/Role</th>
              <th>Total Payment</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student, index) => (
                <tr 
                  key={student.rfidNumber || index}
                  className={hasZeroBalance(student) ? 'zero-balance-row' : ''}
                >
                  <td className="checkbox-column">
                    <Checkbox
                      checked={selectedRows.has(index)}
                      onCheckedChange={() => handleRowCheckboxChange(index)}
                      disabled={hasZeroBalance(student)}
                    />
                  </td>
                  <td>{student.rfidNumber}</td>
                  <td>{student.idNumber}</td>
                  <td>{student.name}</td>
                  <td>{student.course}</td>
                  <td className={`payment ${hasZeroBalance(student) ? 'zero-balance' : ''}`}>
                    {student.totalPayment}
                    {hasZeroBalance(student) && (
                      <span className="zero-badge">Already Zero</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">No students found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}