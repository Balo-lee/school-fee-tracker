import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './DirectorDashboard.css';

const ALL_CLASSES = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

function DirectorDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const name = localStorage.getItem('name');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      const classQuery = classFilter ? `?class=${classFilter}` : '';

      const [metricsRes, studentsRes, defaultersRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get(`/admin/students${classQuery}`),
        api.get(`/admin/defaulters${classQuery}`),
      ]);

      setMetrics(metricsRes.data);
      setStudents(studentsRes.data);
      setDefaulters(defaultersRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }

  function getStatus(student) {
    const paid = parseFloat(student.total_paid);
    const expected = parseFloat(student.total_expected);

    if (expected === 0) return 'unpaid';
    if (paid >= expected) return 'paid';
    if (paid > 0) return 'partial';
    return 'unpaid';
  }

  function formatMoney(amount) {
    return `₦${parseFloat(amount).toLocaleString()}`;
  }

  function handleLogout() {
    localStorage.clear();
    navigate('/login');
  }

  if (loading) {
    return <div className="dashboard">Loading dashboard...</div>;
  }

  if (!metrics) {
    return <div className="dashboard">Failed to load dashboard data. Please check you're logged in and try refreshing.</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Crown Heights College</h1>
          <p>Welcome, {name}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <Link to="/dashboard/admin/fees" className="btn-primary" style={{ textDecoration: 'none' }}>
            Manage Fee Categories
          </Link>
          <button className="logout-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Expected</h3>
          <div className="value">{formatMoney(metrics.totalExpected)}</div>
        </div>
        <div className="metric-card">
          <h3>Total Collected</h3>
          <div className="value">{formatMoney(metrics.totalCollected)}</div>
        </div>
        <div className="metric-card owing">
          <h3>Outstanding</h3>
          <div className="value">{formatMoney(metrics.totalOutstanding)}</div>
        </div>
        <div className="metric-card owing">
          <h3>Defaulters</h3>
          <div className="value">{metrics.defaulterCount}</div>
        </div>
      </div>

      <div className="filter-bar">
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {ALL_CLASSES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="section">
        <h2>Students ({students.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Admission No.</th>
              <th>Paid / Expected</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const status = getStatus(student);
              return (
                <tr key={student.id}>
                  <td>{student.name}{student.middle_name ? ` ${student.middle_name}` : ''}</td>
                  <td>{student.class}</td>
                  <td>{student.admission_number}</td>
                  <td>{formatMoney(student.total_paid)} / {formatMoney(student.total_expected)}</td>
                  <td>
                    <span className={`status-badge status-${status}`}>
                      {status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="section">
        <h2>Defaulters ({defaulters.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Admission No.</th>
              <th>Owing Fee</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {defaulters.map((d, index) => (
              <tr key={`${d.id}-${index}`}>
                <td>{d.name}</td>
                <td>{d.class}</td>
                <td>{d.admission_number}</td>
                <td>{d.fee_name}</td>
                <td>{formatMoney(d.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DirectorDashboard;