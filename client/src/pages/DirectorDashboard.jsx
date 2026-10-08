import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import "../components/Modal.css";
import "./DirectorDashboard.css";

const ALL_CLASSES = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

function DirectorDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [classFilter, setClassFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingStudent, setSavingStudent] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [needsMiddleName, setNeedsMiddleName] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    middleName: "",
    class: "JSS1",
    admissionNumber: "",
  });

  const [editingStudent, setEditingStudent] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const name = localStorage.getItem("name");
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter]);

  useEffect(() => {
    function closeMenu() {
      setContextMenu(null);
    }
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const classQuery = classFilter ? `?class=${classFilter}` : "";

      const [metricsRes, studentsRes, defaultersRes] = await Promise.all([
        api.get("/admin/metrics"),
        api.get(`/admin/students${classQuery}`),
        api.get(`/admin/defaulters${classQuery}`),
      ]);

      setMetrics(metricsRes.data);
      setStudents(studentsRes.data);
      setDefaulters(defaultersRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }

  function getStatus(student) {
    const paid = parseFloat(student.total_paid);
    const expected = parseFloat(student.total_expected);

    if (expected === 0) return "unpaid";
    if (paid >= expected) return "paid";
    if (paid > 0) return "partial";
    return "unpaid";
  }

  function formatMoney(amount) {
    return `₦${parseFloat(amount).toLocaleString()}`;
  }

  function handleLogout() {
    localStorage.clear();
    navigate("/login");
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    setSavingStudent(true);
    try {
      await api.post("/admin/students", newStudent);
      setNewStudent({
        name: "",
        middleName: "",
        class: "JSS1",
        admissionNumber: "",
      });
      setNeedsMiddleName(false);
      setIsAddStudentOpen(false);
      fetchData();
    } catch (err) {
      if (err.response?.data?.needsMiddleName) {
        setNeedsMiddleName(true);
      } else {
        alert(err.response?.data?.message || "Failed to add student");
      }
    } finally {
      setSavingStudent(false);
    }
  }

  function handleRowContextMenu(e, student) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, student });
  }

  function openEditFromMenu() {
    const student = contextMenu.student;
    setEditingStudent({
      id: student.id,
      name: student.name,
      middleName: student.middle_name || "",
      class: student.class,
      admissionNumber: student.admission_number,
    });
    setContextMenu(null);
  }

  async function handleEditStudent(e) {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await api.patch(`/admin/students/${editingStudent.id}`, {
        name: editingStudent.name,
        middleName: editingStudent.middleName,
        class: editingStudent.class,
        admissionNumber: editingStudent.admissionNumber,
      });
      console.log("Edit response:", res.data);
      setEditingStudent(null);
      fetchData();
    } catch (err) {
      console.error("Edit error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to update student");
    } finally {
      setSavingEdit(false);
    }
  }

  if (loading) {
    return <Loading text="Loading dashboard..." />;
  }

  if (!metrics) {
    return (
      <div className="dashboard">
        Failed to load dashboard data. Please check you're logged in and try
        refreshing.
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Crown Heights College</h1>
          <p>Welcome, {name}</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <Link
            to="/dashboard/admin/fees"
            className="btn-primary"
            style={{ textDecoration: "none" }}
          >
            Manage Fee Categories
          </Link>
          <button
            className="btn-primary"
            onClick={() => setIsAddStudentOpen(true)}
          >
            + Add Student
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
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
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="">All Classes</option>
          {ALL_CLASSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="section">
        <h2>Students ({students.length})</h2>
        <p
          style={{
            fontSize: "0.8rem",
            color: "#6b6b63",
            marginBottom: "0.5rem",
          }}
        >
          Right-click a row for options
        </p>
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
                <tr
                  key={student.id}
                  onContextMenu={(e) => handleRowContextMenu(e, student)}
                  style={{ cursor: "context-menu" }}
                >
                  <td>
                    {student.name}
                    {student.middle_name ? ` ${student.middle_name}` : ""}
                  </td>
                  <td>{student.class}</td>
                  <td>{student.admission_number}</td>
                  <td>
                    {formatMoney(student.total_paid)} /{" "}
                    {formatMoney(student.total_expected)}
                  </td>
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

      {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "white",
            border: "1px solid #E3E6E4",
            borderRadius: "4px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
            zIndex: 2000,
            minWidth: "160px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={openEditFromMenu}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "0.7rem 1rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
            }}
          >
            Edit Student
          </button>
        </div>
      )}

      <Modal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
      >
        <h2>Add New Student</h2>
        <form
          onSubmit={handleAddStudent}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <input
            type="text"
            placeholder="Full Name"
            value={newStudent.name}
            onChange={(e) =>
              setNewStudent({ ...newStudent, name: e.target.value })
            }
            required
          />
          {needsMiddleName && (
            <input
              type="text"
              placeholder="Middle Name (required — name already exists)"
              value={newStudent.middleName}
              onChange={(e) =>
                setNewStudent({ ...newStudent, middleName: e.target.value })
              }
              required
            />
          )}
          <select
            value={newStudent.class}
            onChange={(e) =>
              setNewStudent({ ...newStudent, class: e.target.value })
            }
          >
            {ALL_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Admission Number (e.g. CHC/1153)"
            value={newStudent.admissionNumber}
            onChange={(e) =>
              setNewStudent({ ...newStudent, admissionNumber: e.target.value })
            }
            required
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={savingStudent}
          >
            {savingStudent ? "Saving..." : "Add Student"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!editingStudent} onClose={() => setEditingStudent(null)}>
        {editingStudent && (
          <>
            <h2>Edit Student</h2>
            <form
              onSubmit={handleEditStudent}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <input
                type="text"
                placeholder="Full Name"
                value={editingStudent.name}
                onChange={(e) =>
                  setEditingStudent({ ...editingStudent, name: e.target.value })
                }
                required
              />
              <select
                value={editingStudent.class}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    class: e.target.value,
                  })
                }
              >
                {ALL_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Admission Number"
                value={editingStudent.admissionNumber}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    admissionNumber: e.target.value,
                  })
                }
                required
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={savingEdit}
              >
                {savingEdit ? "Saving changes..." : "Save Changes"}
              </button>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}

export default DirectorDashboard;
