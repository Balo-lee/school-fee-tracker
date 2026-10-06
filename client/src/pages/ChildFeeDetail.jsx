import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './DirectorDashboard.css';
import './ParentDashboard.css';

function ChildFeeDetail() {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payingFeeId, setPayingFeeId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await api.get(`/parent/fees/${studentId}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load fee detail', err);
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(amount) {
    return `₦${parseFloat(amount).toLocaleString()}`;
  }

    async function handlePayNow(feeStructureId) {
    setPayingFeeId(feeStructureId);
    try {
      const res = await api.post('/payments/initialize', {
        studentId: student.id,
        feeStructureId,
      });
      window.location.href = res.data.authorizationUrl;
    } catch (err) {
      alert('Failed to start payment: ' + (err.response?.data?.message || err.message));
      setPayingFeeId(null);
    }
  }

  function handleLogout() {
    localStorage.clear();
    navigate('/login');
  }

  if (loading) return <div className="dashboard">Loading...</div>;
  if (!data) return <div className="dashboard">Could not load this student's fees.</div>;

  const { student, fees } = data;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <Link to="/dashboard/parent" className="back-link">&larr; Back to My Children</Link>
          <h1>{student.name}{student.middle_name ? ` ${student.middle_name}` : ''}</h1>
          <p>{student.class} &bull; {student.admission_number}</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Log Out</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Fee</th>
            <th>Term</th>
            <th>Amount</th>
            <th>Paid</th>
            <th>Balance</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {fees.map((fee) => {
            const amount = parseFloat(fee.amount);
            const paid = parseFloat(fee.amount_paid);
            const balance = amount - paid;
            const isFullyPaid = balance <= 0;

            return (
              <tr key={fee.fee_structure_id}>
                <td>{fee.fee_name} {fee.mandatory && <span style={{ color: 'var(--color-owing)', fontSize: '0.75rem' }}>*</span>}</td>
                <td>{fee.term || 'One-time'}</td>
                <td>{formatMoney(amount)}</td>
                <td>{formatMoney(paid)}</td>
                <td>{formatMoney(balance)}</td>
                                <td>
                  {isFullyPaid ? (
                    <span className="status-badge status-paid">PAID</span>
                  ) : (
                    <button
                      className="action-btn"
                      onClick={() => handlePayNow(fee.fee_structure_id)}
                      disabled={payingFeeId === fee.fee_structure_id}
                    >
                      {payingFeeId === fee.fee_structure_id ? 'Redirecting...' : 'Pay Now'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ fontSize: '0.8rem', color: '#6b6b63', marginTop: '0.5rem' }}>
        * Mandatory fee
      </p>
    </div>
  );
}

export default ChildFeeDetail;