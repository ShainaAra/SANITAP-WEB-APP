import React, { useState } from 'react';
import './List.css';
import ListTable from '../../components/ListTable';

export default function List() {
  const [filterText, setFilterText] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    rfidNumber: '',
    idNumber: '',
    name: '',
    course: ''
  });

  // Dummy data for students
  const students = [
    {
      rfidNumber: '001',
      idNumber: '22-020892',
      name: 'Jamie Jodelle H. Malvar',
      course: 'BSIT',
      totalPayment: '₱ 10.00'
    },
    {
      rfidNumber: '002',
      idNumber: '22-020842',
      name: 'Adrian Nash U. Semana',
      course: 'BSIT',
      totalPayment: '₱ 100.00'
    },
    {
      rfidNumber: '003',
      idNumber: '22-020832',
      name: 'Shaina Ara S. Queturas',
      course: 'BSIT',
      totalPayment: '₱ 30.00'
    },
    {
      rfidNumber: '004',
      idNumber: '22-123456',
      name: 'Kim Mingyu',
      course: 'BSCS',
      totalPayment: '₱ 40.00'
    },
    {
      rfidNumber: '005',
      idNumber: '22-234567',
      name: 'Alex Balaan',
      course: 'BSIT',
      totalPayment: '₱ 75.00'
    },
    {
      rfidNumber: '006',
      idNumber: '22-345678',
      name: 'Alvin Magbanua',
      course: 'BSCS',
      totalPayment: '₱ 60.00'
    },
    {
      rfidNumber: '007',
      idNumber: '23-123456',
      name: 'Boo Seungkwan',
      course: 'BSCS',
      totalPayment: '₱ 0.00'
    },
    {
      rfidNumber: '008',
      idNumber: '24-345678',
      name: 'Joshua Hong',
      course: 'BSIT',
      totalPayment: '₱ 140.00'
    },
    {
      rfidNumber: '009',
      idNumber: '25-010205',
      name: 'Marc Louise Tagala',
      course: 'BSCS',
      totalPayment: '₱ 80.00'
    },
    {
      rfidNumber: '010',
      idNumber: '24-526890',
      name: 'Jefferson Retamal',
      course: 'BSIT',
      totalPayment: '₱ 82.00'
    },
    {
      rfidNumber: '011',
      idNumber: '25-312348',
      name: 'Marites Dancel',
      course: 'BSCS',
      totalPayment: '₱ 92.00'
    },
    {
      rfidNumber: '012',
      idNumber: '25-345678',
      name: 'Jenella Yvonne Cañete',
      course: 'BSIT',
      totalPayment: '₱ 56.00'
    },
     {
      rfidNumber: '101',
      idNumber: '123456',
      name: 'Bongbong Marcos',
      course: 'Faculty',
      totalPayment: '₱ 96.00'
    },
    {
      rfidNumber: '102',
      idNumber: '789435',
      name: 'Evangeline IDK',
      course: 'Staff',
      totalPayment: '₱ 76.00'
    },
  ];

  // Filter students based on search text and course
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(filterText.toLowerCase()) ||
      student.idNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      student.rfidNumber.toLowerCase().includes(filterText.toLowerCase());
    
    const matchesCourse = courseFilter === '' || student.course === courseFilter;
    
    return matchesSearch && matchesCourse;
  });

  const handleExport = () => {
    // Create CSV content
    const headers = ['RFID Number', 'ID Number', 'Name', 'Course', 'Total Payment'];
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(student =>
        [
          student.rfidNumber,
          student.idNumber,
          `"${student.name}"`,
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

  const handleAddUser = () => {
    if (formData.rfidNumber && formData.idNumber && formData.name && formData.course) {
      // Here you would typically send the data to a server
      console.log('Adding new user:', formData);
      // Reset form and close modal
      setFormData({
        rfidNumber: '',
        idNumber: '',
        name: '',
        course: ''
      });
      setShowAddModal(false);
    }
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
          <button className="add-button" onClick={() => setShowAddModal(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add User
          </button>
          <button className="filter-button">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Courses</option>
              <option value="BSIT">BSIT</option>
              <option value="BSCS">BSCS</option>
              <option value="Faculty">Faculty</option>
              <option value="Staff">Staff</option>
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form className="add-user-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label className="form-label">RFID Number</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Enter RFID number"
                    value={formData.rfidNumber}
                    onChange={(e) => setFormData({...formData, rfidNumber: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ID Number</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Enter ID number"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Course/Role</label>
                  <select 
                    className="form-input"
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                  >
                    <option value="">Select an option</option>
                    <option value="BSIT">BSIT</option>
                    <option value="BSCS">BSCS</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddUser}
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
