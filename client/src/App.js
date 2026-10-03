import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import DirectorDashboard from "./pages/DirectorDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute allowedRoles={["director", "bursar", "principal"]}>
            <DirectorDashboard />
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
