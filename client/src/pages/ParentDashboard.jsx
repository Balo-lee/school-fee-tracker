import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './DirectorDashboard.css';
import './ParentDashboard.css';
import Loading from '../components/Loading';

function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const name = localStorage.getItem('name');
  const navigate = useNavigate();

  useEffect(() => {
    fetchChildren();
  }, []);

    async function fetchChildren() {
    setLoading(true);
    try {
      const [childrenRes, historyRes] = await Promise.all([
        api.get('/parent/children'),
        api.get('/parent/payment-history'),
      ]);
      setChildren(childrenRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(amount) {
    return `₦${parseFloat(amount).toLocaleString()}`;
  }

    async function handleDownloadReceipt(paymentId, receiptNumber) {
    try {
      const response = await api.get(`/parent/receipts/${paymentId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download receipt');
    }
  }

  function handleLogout() {
    localStorage.clear();
    navigate('/login');
  }

  if (loading) {
    return <Loading text="Loading your children's records..." />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Crown Heights College</h1>
          <p>Welcome, {name}</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Log Out</button>
      </div>

      {children.length === 0 ? (
        <p>No children linked to your account yet.</p>
      ) : (
        <div className="children-grid">
          {children.map((child) => {
            const paid = parseFloat(child.total_paid);
            const expected = parseFloat(child.total_expected);
            const balance = expected - paid;
            const percent = expected > 0 ? Math.min((paid / expected) * 100, 100) : 0;

            return (
              <div className="child-card" key={child.id}>
                <h3>{child.name}{child.middle_name ? ` ${child.middle_name}` : ''}</h3>
                <p className="child-meta">{child.class} &bull; {child.admission_number}</p>

                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
                </div>

                <div className="balance-row">
                  <span className="label">Paid</span>
                  <span>{formatMoney(paid)}</span>
                </div>
                <div className="balance-row">
                  <span className="label">Balance Due</span>
                  <span>{formatMoney(balance)}</span>
                </div>

                <Link to={`/dashboard/parent/child/${child.id}`} className="btn-primary" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', marginTop: '1rem' }}>
                  View Details & Pay
                </Link>
              </div>
            );
          })}
        </div>
      )}
            <div className="history-table-wrap">
        <h2>Payment History</h2>
        {history.length === 0 ? (
          <p>No payments made yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Fee</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.payment_id}>
                  <td>{h.student_name}</td>
                  <td>{h.fee_name}</td>
                  <td>{formatMoney(h.amount_paid)}</td>
                  <td>{new Date(h.paid_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="download-link"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => handleDownloadReceipt(h.payment_id, h.receipt_number)}
                    >
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ParentDashboard;