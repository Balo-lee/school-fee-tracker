import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './DirectorDashboard.css';
import './ParentDashboard.css';

function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  const name = localStorage.getItem('name');
  const navigate = useNavigate();

  useEffect(() => {
    fetchChildren();
  }, []);

  async function fetchChildren() {
    setLoading(true);
    try {
      const res = await api.get('/parent/children');
      setChildren(res.data);
    } catch (err) {
      console.error('Failed to load children', err);
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(amount) {
    return `₦${parseFloat(amount).toLocaleString()}`;
  }

  function handleLogout() {
    localStorage.clear();
    navigate('/login');
  }

  if (loading) {
    return <div className="dashboard">Loading your children's records...</div>;
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
    </div>
  );
}

export default ParentDashboard;