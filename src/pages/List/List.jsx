import React, { useState } from 'react';
import './List.css';
import ListTable from '../../components/ListTable';

export default function List() {
  const [filterText, setFilterText] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  // Dummy data for students
  const students = [
    {
      rfidNumber: '001',
      studentNumber: '22-020892',
      studentName: 'Jamie Jodelle H. Malvar',
      course: 'BSIT',
      totalPayment: '₱ 10.00'
    },
    {
      rfidNumber: '002',
      studentNumber: '22-020842',
      studentName: 'Adrian Nash U. Semana',
      course: 'BSIT',
      totalPayment: '₱ 100.00'
    },
    {
      rfidNumber: '003',
      studentNumber: '22-020832',
      studentName: 'Shaina Ara S. Queturas',
      course: 'BSIT',
      totalPayment: '₱ 30.00'
    },
    {
      rfidNumber: '004',
      studentNumber: '22-123456',
      studentName: 'Kim Mingyu',
      course: 'BSCS',
      totalPayment: '₱ 40.00'
    },
    {
      rfidNumber: '005',
      studentNumber: '22-234567',
      studentName: 'Alex Balaan',
      course: 'BSIT',
      totalPayment: '₱ 75.00'
    },
    {
      rfidNumber: '006',
      studentNumber: '22-345678',
      studentName: 'Alvin Magbanua',
      course: 'BSCS',
      totalPayment: '₱ 60.00'
    },
    {
      rfidNumber: '007',
      studentNumber: '23-123456',
      studentName: 'Boo Seungkwan',
      course: 'BSCS',
      totalPayment: '₱ 0.00'
    },
    {
      rfidNumber: '008',
      studentNumber: '24-345678',
      studentName: 'Joshua Hong',
      course: 'BSIT',
      totalPayment: '₱ 140.00'
    },
    {
      rfidNumber: '009',
      studentNumber: '25-010205',
      studentName: 'Marc Louise Tagala',
      course: 'BSCS',
      totalPayment: '₱ 80.00'
    },
    {
      rfidNumber: '010',
      studentNumber: '24-526890',
      studentName: 'Jefferson Retamal',
      course: 'BSIT',
      totalPayment: '₱ 82.00'
    },
    {
      rfidNumber: '011',
      studentNumber: '25-312348',
      studentName: 'Marites Dancel',
      course: 'BSCS',
      totalPayment: '₱ 92.00'
    },
    {
      rfidNumber: '012',
      studentNumber: '25-345678',
      studentName: 'Marites Dancel',
      course: 'BSIT',
      totalPayment: '₱ 56.00'
    },
  ];

  // Filter students based on search text and course
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.studentName.toLowerCase().includes(filterText.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      student.rfidNumber.toLowerCase().includes(filterText.toLowerCase());
    
    const matchesCourse = courseFilter === '' || student.course === courseFilter;
    
    return matchesSearch && matchesCourse;
  });

  const handleExport = () => {
    // Create CSV content
    const headers = ['RFID Number', 'Student Number', 'Student Name', 'Course', 'Total Payment'];
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(student =>
        [
          student.rfidNumber,
          student.studentNumber,
          `"${student.studentName}"`,
          student.course,
          student.totalPayment
        ].join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="list-page">
      <div className="list-header">
        <h1>Student Transaction Records</h1>
        <div className="list-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by RFID number, Student number, or Name"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="filter-button">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Courses</option>
              <option value="BSIT">BSIT</option>
              <option value="BSCS">BSCS</option>
            </select>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filter
          </button>
          <button className="export-button" onClick={handleExport}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export
          </button>
        </div>
      </div>

      <div className="list-content">
        <ListTable students={filteredStudents} />
      </div>
    </div>
  );
}
