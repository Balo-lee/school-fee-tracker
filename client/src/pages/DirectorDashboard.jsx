import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './DirectorDashboard.css';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import '../components/Modal.css';

const ALL_CLASSES = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

function DirectorDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
const [needsMiddleName, setNeedsMiddleName] = useState(false);
const [newStudent, setNewStudent] = useState({ name: '', middleName: '', class: 'JSS1', admissionNumber: '' });

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

  async function handleAddStudent(e) {
  e.preventDefault();
  try {
    await api.post('/admin/students', newStudent);
    setNewStudent({ name: '', middleName: '', class: 'JSS1', admissionNumber: '' });
    setNeedsMiddleName(false);
    setIsAddStudentOpen(false);
    fetchData();
  } catch (err) {
    if (err.response?.data?.needsMiddleName) {
      setNeedsMiddleName(true);
    } else {
      alert(err.response?.data?.message || 'Failed to add student');
    }
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
    return <Loading text="Loading dashboard..." />;
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
          <button className="btn-primary" onClick={() => setIsAddStudentOpen(true)}>+ Add Student</button>
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

      <Modal isOpen={isAddStudentOpen} onClose={() => setIsAddStudentOpen(false)}>
  <h2>Add New Student</h2>
  <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <input
      type="text"
      placeholder="Full Name"
      value={newStudent.name}
      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
      required
    />
    {needsMiddleName && (
      <input
        type="text"
        placeholder="Middle Name (required — name already exists)"
        value={newStudent.middleName}
        onChange={(e) => setNewStudent({ ...newStudent, middleName: e.target.value })}
        required
      />
    )}
    <select
      value={newStudent.class}
      onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
    >
      {ALL_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
    <input
      type="text"
      placeholder="Admission Number (e.g. CHC/1153)"
      value={newStudent.admissionNumber}
      onChange={(e) => setNewStudent({ ...newStudent, admissionNumber: e.target.value })}
      required
    />
    <button type="submit" className="btn-primary">Add Student</button>
  </form>
</Modal>
    </div>
  );
}

export default DirectorDashboard;