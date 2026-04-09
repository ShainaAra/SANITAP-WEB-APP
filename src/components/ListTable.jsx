import React, { useState } from 'react';
import './ListTable.css';
import { Checkbox } from './ui/checkbox';

export default function ListTable({ students, onClearBalance, onDeleteUsers }) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isClearing, setIsClearing] = useState(false);

  const getPaymentValue = (student) => {
    if (typeof student.totalPayment === "string") {
      return parseFloat(student.totalPayment.replace(/[₱, ]/g, '')) || 0;
    }
    return parseFloat(student.totalPayment) || 0;
  };

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

  const selectedStudents = Array.from(selectedRows).map(index => students[index]);

  setIsClearing(true);
  try {
    await onClearBalance(selectedStudents);
    setSelectedRows(new Set());
  } catch (error) {
    console.error('Error clearing balances:', error);
    alert('Failed to clear balances. Please try again.');
  } finally {
    setIsClearing(false);
  }
};

  const showClearedBadge = (student) => {
    const paymentValue = getPaymentValue(student);
    return paymentValue === 0 && student.wasCleared;
  };

  const isNewWithZero = (student) => {
    const paymentValue = getPaymentValue(student);
    return paymentValue === 0 && !student.wasCleared;
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
            {isClearing ? 'Clearing...' : `Clear Balance (${selectedRows.size})`}
          </button>

          <button
            className="delete-button"
            onClick={() => {
              const selectedStudents = Array.from(selectedRows).map(index => students[index]);
              onDeleteUsers(selectedStudents);
            }}
          >
            Delete ({selectedRows.size})
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
              students.map((student, index) => {
                const cleared = showClearedBadge(student);
                const newZero = isNewWithZero(student);

                return (
                  <tr
                    key={student.rfidNumber || index}
                    className={cleared ? 'cleared-row' : newZero ? 'new-zero-row' : ''}
                  >
                    <td className="checkbox-column">
                      <Checkbox
                        checked={selectedRows.has(index)}
                        onCheckedChange={() => handleRowCheckboxChange(index)}
                        disabled={false}
                      />
                    </td>
                    <td>{student.rfidNumber}</td>
                    <td>{student.idNumber}</td>
                    <td>{student.name}</td>
                    <td>{student.course}</td>
                    <td className={`payment ${cleared ? 'cleared-balance' : newZero ? 'new-zero' : ''}`}>
                      {student.totalPayment}
                      {cleared && (
                        <span className="cleared-badge">CLEARED</span>
                      )}
                      {newZero && (
                        <span className="new-badge">NEW</span>
                      )}
                    </td>
                  </tr>
                );
              })
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