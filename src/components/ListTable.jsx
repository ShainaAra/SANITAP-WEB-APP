import React from 'react';
import './ListTable.css';

export default function ListTable({ students }) {
  return (
    <div className="list-table-wrapper">
      <table className="list-table">
        <thead>
          <tr>
            <th>RFID Number</th>
            <th>Student Number</th>
            <th>Student Name</th>
            <th>Course</th>
            <th>Total Payment</th>
          </tr>
        </thead>
        <tbody>
          {students.length > 0 ? (
            students.map((student, index) => (
              <tr key={index}>
                <td>{student.rfidNumber}</td>
                <td>{student.studentNumber}</td>
                <td>{student.studentName}</td>
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
