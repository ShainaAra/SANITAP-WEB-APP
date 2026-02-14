import React from 'react';
import './ListTable.css';

export default function ListTable({ students }) {
  return (
    <div className="list-table-wrapper">
      <table className="list-table">
        <thead>
          <tr>
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
              <tr key={index}>
                <td>{student.rfidNumber}</td>
                <td>{student.idNumber}</td>
                <td>{student.name}</td>
                <td>{student.course}</td>
                <td className="payment">{student.totalPayment}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="no-data">No students found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
