import React, { useState, useEffect } from 'react';
import './List.css';
import ListTable from '../../components/ListTable';

export default function List() {
  const [filterText, setFilterText] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    rfidNumber: '',
    idNumber: '',
    name: '',
    course: ''
  });

  // Fetch users from database
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (!filterText.trim()) {
      fetchUsers();
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/users/search?query=${encodeURIComponent(filterText)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Handle Enter key in search
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Filter users based on course (client-side filtering after search)
  const filteredUsers = users.filter(user => {
    const matchesCourse = courseFilter === '' || user.course === courseFilter;
    return matchesCourse;
  });

  const handleExport = () => {
    // Create CSV content
    const headers = ['RFID Number', 'ID Number', 'Name', 'Course', 'Total Payment'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user =>
        [
          user.rfidNumber,
          user.idNumber,
          "${user.name}",
          user.course,
          user.totalPayment
        ].join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAddUser = async () => {
    if (formData.rfidNumber && formData.idNumber && formData.name && formData.course) {
      try {
        const response = await fetch('http://localhost:5001/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add user');
        }

        // Reset form and close modal
        setFormData({
          rfidNumber: '',
          idNumber: '',
          name: '',
          course: ''
        });
        setShowAddModal(false);
        
        // Refresh the user list
        fetchUsers();
        
        alert('User added successfully!');
      } catch (err) {
        alert('Error adding user: ' + err.message);
      }
    } else {
      alert('Please fill in all fields');
    }
  };

  // ADD THIS NEW FUNCTION HERE - right after handleAddUser and before the return statement
  const handleClearBalance = async (selectedStudents) => {
  try {
    // Filter out any students that might have zero balance (just in case)
    const studentsToClear = selectedStudents.filter(student => {
      const paymentValue = parseFloat(student.totalPayment.replace('₱ ', ''));
      return paymentValue > 0;
    });

    if (studentsToClear.length === 0) {
      alert('No users with non-zero balance selected.');
      return;
    }

    if (studentsToClear.length < selectedStudents.length) {
      const skippedCount = selectedStudents.length - studentsToClear.length;
      alert(`${skippedCount} user(s) with zero balance were skipped.`);
    }

    // Update each selected student's balance to 0
    const updatePromises = studentsToClear.map(student => 
      fetch(`http://localhost:5001/api/users/${student.rfidNumber}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ totalPayment: 0 })
      })
    );

    const responses = await Promise.all(updatePromises);
    
    // Check if all updates were successful
    const allSuccessful = responses.every(response => response.ok);
    
    if (!allSuccessful) {
      throw new Error('Some balances could not be cleared');
    }

    // Refresh the user list
    await fetchUsers();
    
    // Show success message
    if (studentsToClear.length === 1) {
      alert(`Successfully cleared balance for ${studentsToClear[0].name}!`);
    } else {
      alert(`Successfully cleared balances for ${studentsToClear.length} user(s)!`);
    }
  } catch (err) {
    console.error('Error clearing balances:', err);
    alert('Error clearing balances: ' + err.message);
    throw err; // Re-throw to be caught in ListTable
  }
};

  if (loading && users.length === 0) return <div className="list-page"><div className="loading">Loading users...</div></div>;
  if (error) return <div className="list-page"><div className="error">Error: {error}</div></div>;

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
              onKeyPress={handleKeyPress}
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
        {loading && <div className="loading">Updating...</div>}
        {/* UPDATE THIS LINE - pass the handleClearBalance function as a prop */}
        <ListTable students={filteredUsers} onClearBalance={handleClearBalance} />
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
                    required
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
                    required
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
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Course/Role</label>
                  <select 
                    className="form-input"
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                    required
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