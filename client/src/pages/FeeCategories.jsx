import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import '../components/Modal.css';
import './DirectorDashboard.css';
import './FeeCategories.css';

const ALL_CLASSES = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

function FeeCategories() {
  const [feeCategories, setFeeCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const role = localStorage.getItem('role');

  const [newFee, setNewFee] = useState({
    name: '', mandatory: true, recurrenceType: 'recurring',
    classes: [], term: '', amount: '',
  });

  useEffect(() => {
    fetchFees();
  }, []);

  async function fetchFees() {
    setLoading(true);
    try {
      const res = await api.get('/admin/fee-categories');
      setFeeCategories(res.data);
    } catch (err) {
      console.error('Failed to load fee categories', err);
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(amount) {
    return `₦${parseFloat(amount).toLocaleString()}`;
  }

  function toggleClassCheckbox(className) {
    setNewFee((prev) => {
      const isSelected = prev.classes.includes(className);
      const updatedClasses = isSelected
        ? prev.classes.filter((c) => c !== className)
        : [...prev.classes, className];
      return { ...prev, classes: updatedClasses };
    });
  }

  async function handleCreateFee(e) {
    e.preventDefault();
    try {
      await api.post('/admin/fee-categories', {
        ...newFee,
        amount: parseFloat(newFee.amount),
        term: newFee.term || null,
      });
      setNewFee({ name: '', mandatory: true, recurrenceType: 'recurring', classes: [], term: '', amount: '' });
      setIsModalOpen(false);
      fetchFees();
    } catch (err) {
      alert('Failed to create fee: ' + (err.response?.data?.message || err.message));
    }
  }

  async function handleToggle(categoryId) {
    try {
      await api.patch(`/admin/fee-categories/${categoryId}/toggle`);
      fetchFees();
    } catch (err) {
      alert('Failed to update status');
    }
  }

  async function handleEditAmount(categoryId, currentAmount) {
    const newAmount = window.prompt('Enter new amount (₦):', currentAmount);
    if (newAmount === null || newAmount.trim() === '') return;
    try {
      await api.patch(`/admin/fee-categories/${categoryId}`, { amount: parseFloat(newAmount) });
      fetchFees();
    } catch (err) {
      alert('Failed to update amount');
    }
  }

  function groupFeeCategories() {
    const grouped = {};
    for (const row of feeCategories) {
      if (!grouped[row.id]) {
        grouped[row.id] = {
          id: row.id, name: row.name, mandatory: row.mandatory,
          is_active: row.is_active, structures: [],
        };
      }
      if (row.structure_id) {
        grouped[row.id].structures.push({ class: row.class, amount: row.amount });
      }
    }
    return Object.values(grouped);
  }

  if (loading) return <div className="dashboard">Loading fee categories...</div>;

  const groupedFees = groupFeeCategories();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <Link to="/dashboard/admin" className="back-link">&larr; Back to Dashboard</Link>
          <h1>Fee Categories</h1>
        </div>
        {role === 'director' && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Fee</button>
        )}
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Mandatory</th>
            <th>Classes & Amounts</th>
            <th>Status</th>
            {role === 'director' && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {groupedFees.map((fee) => (
            <tr key={fee.id}>
              <td>{fee.name}</td>
              <td>{fee.mandatory ? 'Yes' : 'No'}</td>
              <td>{fee.structures.map((s) => `${s.class}: ${formatMoney(s.amount)}`).join(', ')}</td>
              <td>
                {role === 'director' ? (
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={fee.is_active}
                      onChange={() => handleToggle(fee.id)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                ) : (
                  <span className={`status-badge ${fee.is_active ? 'status-paid' : 'status-unpaid'}`}>
                    {fee.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                )}
              </td>
              {role === 'director' && (
                <td>
                  <button className="action-btn" onClick={() => handleEditAmount(fee.id, fee.structures[0]?.amount)}>
                    Edit Amount
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Add New Fee</h2>
        <form className="fee-form-modal" onSubmit={handleCreateFee}>
          <div className="field">
            <label>Fee Name</label>
            <input type="text" value={newFee.name} onChange={(e) => setNewFee({ ...newFee, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>Amount (₦)</label>
            <input type="number" value={newFee.amount} onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })} required />
          </div>
          <div className="field">
            <label>Recurrence</label>
            <select value={newFee.recurrenceType} onChange={(e) => setNewFee({ ...newFee, recurrenceType: e.target.value })}>
              <option value="recurring">Recurring</option>
              <option value="one_time">One-time</option>
            </select>
          </div>
          <div className="field">
            <label>Mandatory?</label>
            <select value={newFee.mandatory ? 'yes' : 'no'} onChange={(e) => setNewFee({ ...newFee, mandatory: e.target.value === 'yes' })}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="field">
            <label>Applies to</label>
            <div className="class-checkboxes">
              {ALL_CLASSES.map((c) => (
                <label key={c}>
                  <input type="checkbox" checked={newFee.classes.includes(c)} onChange={() => toggleClassCheckbox(c)} />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary">Save Fee</button>
        </form>
      </Modal>
    </div>
  );
}

export default FeeCategories;