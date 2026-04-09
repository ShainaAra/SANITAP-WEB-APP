import React, { useState, useEffect, useCallback } from 'react';
import './List.css';
import ListTable from '../../components/ListTable';
import { authFetch } from "../../utils/authFetch";
import ConfirmModal from "../../components/ConfirmModal";
import StatusModal from "../../components/StatusModal";

export default function List() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState(null); // "clear" | "delete"
  const [confirmStudents, setConfirmStudents] = useState([]);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusTitle, setStatusTitle] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");

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

  const showStatusModal = (title, message, type = "info") => {
    setStatusTitle(title);
    setStatusMessage(message);
    setStatusType(type);
    setStatusOpen(true);
  };

  const closeStatusModal = () => {
    setStatusOpen(false);
    setStatusTitle("");
    setStatusMessage("");
    setStatusType("info");
  };

  const openClearConfirm = (selectedStudents) => {
    setConfirmType("clear");
    setConfirmStudents(selectedStudents);
    setConfirmOpen(true);
  };

  const openDeleteConfirm = (selectedStudents) => {
    setConfirmType("delete");
    setConfirmStudents(selectedStudents);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (confirmLoading) return;
    setConfirmOpen(false);
    setConfirmType(null);
    setConfirmStudents([]);
  };

  const getPaymentValue = (student) => {
    if (typeof student.totalPayment === 'string') {
      return parseFloat(student.totalPayment.replace(/[₱, ]/g, '')) || 0;
    }
    return parseFloat(student.totalPayment) || 0;
  };

  const fetchUsers = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const trimmedQuery = filterText.trim();

      const url = trimmedQuery
        ? `http://localhost:5001/api/users/search?query=${encodeURIComponent(trimmedQuery)}`
        : "http://localhost:5001/api/users";

      const response = await authFetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsers([]);
      setError(err.message);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [filterText]);

  useEffect(() => {
    fetchUsers(true);

    if (filterText.trim()) return;

    const interval = setInterval(() => {
      fetchUsers(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchUsers, filterText]);

  const handleSearch = () => {
    fetchUsers(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleModalKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUser();
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesCourse = courseFilter === '' || user.course === courseFilter;
    return matchesCourse;
  });

  const handleExport = () => {
    const headers = ['RFID Number', 'ID Number', 'Name', 'Course', 'Total Payment'];

    const csvContent = [
      headers.join(','),
      ...filteredUsers.map((user) =>
        [
          user.rfidNumber,
          user.idNumber,
          `"${user.name}"`,
          user.course,
          user.totalPayment
        ].join(',')
      )
    ].join('\n');

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
        const response = await authFetch('http://localhost:5001/api/users', {
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

        setFormData({
          rfidNumber: '',
          idNumber: '',
          name: '',
          course: ''
        });

        setShowAddModal(false);
        await fetchUsers(true);

        showStatusModal("User Added", "User added successfully!", "success");
      } catch (err) {
        showStatusModal("Add User Failed", err.message, "error");
      }
    } else {
      showStatusModal("Missing Information", "Please fill in all fields.", "warning");
    }
  };

  const handleClearBalance = async (selectedStudents) => {
    try {
      if (!selectedStudents || selectedStudents.length === 0) {
        showStatusModal("No Selection", "Please select at least one user.", "warning");
        return;
      }

      const studentsWithBalance = selectedStudents.filter((student) => {
        const paymentValue = getPaymentValue(student);
        return paymentValue > 0;
      });

      const studentsWithZeroBalance = selectedStudents.filter((student) => {
        const paymentValue = getPaymentValue(student);
        return paymentValue === 0;
      });

      if (studentsWithBalance.length === 0) {
        const zeroNames = studentsWithZeroBalance.map((student) => student.name).join(", ");
        showStatusModal(
          "Already Zero Balance",
          `The selected user(s) already have 0 balance:\n${zeroNames}`,
          "warning"
        );
        return;
      }

      const rfids = studentsWithBalance.map((student) => student.rfidNumber);

      const response = await authFetch('http://localhost:5001/api/clear-balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rfids })
      });

      const data = await response.json();

      if (data.status !== 'SUCCESS') {
        throw new Error('Failed to clear balances');
      }

      await fetchUsers(true);

      if (studentsWithZeroBalance.length > 0) {
        const zeroNames = studentsWithZeroBalance.map((student) => student.name).join(", ");
        showStatusModal(
          "Balance Cleared",
          `Successfully cleared ${studentsWithBalance.length} user(s).\n\nThese user(s) already had 0 balance:\n${zeroNames}`,
          "success"
        );
      } else {
        showStatusModal(
          studentsWithBalance.length === 1 ? "Balance Cleared" : "Balances Cleared",
          studentsWithBalance.length === 1
            ? `Successfully cleared balance for ${studentsWithBalance[0].name}!`
            : `Successfully cleared balances for ${studentsWithBalance.length} user(s)!`,
          "success"
        );
      }
    } catch (err) {
      console.error('Error clearing balances:', err);
      showStatusModal("Clear Balance Failed", err.message, "error");
      throw err;
    }
  };

  const handleDeleteUsers = async (selectedStudents) => {
    try {
      if (!selectedStudents || selectedStudents.length === 0) {
        showStatusModal("No Selection", "Please select at least one user to delete.", "warning");
        return;
      }

      for (const student of selectedStudents) {
        const response = await authFetch(
          `http://localhost:5001/api/users/${student.rfidNumber}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to delete ${student.name}`);
        }
      }

      await fetchUsers(true);

      showStatusModal(
        selectedStudents.length === 1 ? "User Deleted" : "Users Deleted",
        selectedStudents.length === 1
          ? "User deleted successfully!"
          : `${selectedStudents.length} user(s) deleted successfully!`,
        "success"
      );
    } catch (err) {
      console.error("Error deleting users:", err);
      showStatusModal("Delete Failed", err.message, "error");
    }
  };

  const handleConfirmAction = async () => {
    try {
      setConfirmLoading(true);

      if (confirmType === "clear") {
        await handleClearBalance(confirmStudents);
      } else if (confirmType === "delete") {
        await handleDeleteUsers(confirmStudents);
      }

      closeConfirm();
    } catch (err) {
      console.error("Confirm action failed:", err);
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="list-page">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="list-page">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

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
              onKeyDown={handleKeyPress}
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
        <ListTable
          students={filteredUsers}
          onClearBalance={openClearConfirm}
          onDeleteUsers={openDeleteConfirm}
        />
      </div>

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
                    onChange={(e) => setFormData({ ...formData, rfidNumber: e.target.value })}
                    onKeyDown={handleModalKeyPress}
                    autoFocus
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
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    onKeyDown={handleModalKeyPress}
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onKeyDown={handleModalKeyPress}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Course/Role</label>
                  <select
                    className="form-input"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    onKeyDown={handleModalKeyPress}
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

      <ConfirmModal
        open={confirmOpen}
        title={confirmType === "delete" ? "Delete Student Record?" : "Clear Selected Balance?"}
        message={
          confirmType === "delete"
            ? confirmStudents.length === 1
              ? `This action will permanently remove ${confirmStudents[0]?.name}'s record from the system.`
              : `This action will permanently remove ${confirmStudents.length} selected student records from the system.`
            : confirmStudents.length === 1
            ? `This will clear the outstanding balance of ${confirmStudents[0]?.name}.`
            : `This will clear the outstanding balances of ${confirmStudents.length} selected users.`
        }
        confirmText={confirmType === "delete" ? "Delete" : "Clear Balance"}
        cancelText="Cancel"
        variant={confirmType === "delete" ? "danger" : "default"}
        loading={confirmLoading}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirm}
      />

      <StatusModal
        open={statusOpen}
        title={statusTitle}
        message={statusMessage}
        type={statusType}
        onClose={closeStatusModal}
      />
    </div>
  );
}