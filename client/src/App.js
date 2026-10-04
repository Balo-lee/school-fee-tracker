import Landing from "./pages/Landing";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DirectorDashboard from "./pages/DirectorDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import FeeCategories from "./pages/FeeCategories";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute allowedRoles={["director", "bursar", "principal"]}>
            <DirectorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/admin/fees"
        element={
          <ProtectedRoute allowedRoles={["director", "bursar", "principal"]}>
            <FeeCategories />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/parent"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
