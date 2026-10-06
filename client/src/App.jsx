import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import HomeRedirect from "./components/HomeRedirect.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import { resourceConfigs } from "./config/resources.js";
import Dashboard from "./pages/Dashboard.jsx";
import DriverPortal from "./pages/DriverPortal.jsx";
import Login from "./pages/Login.jsx";
import Reports from "./pages/Reports.jsx";
import ResourcePage from "./pages/ResourcePage.jsx";
import Users from "./pages/Users.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<HomeRedirect />} />
          <Route element={<RoleRoute roles={["admin", "manager"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {Object.entries(resourceConfigs).map(([key, config]) => (
              <Route key={key} path={`/${key}`} element={<ResourcePage config={config} />} />
            ))}
            <Route path="/reports" element={<Reports />} />
          </Route>
          <Route element={<RoleRoute roles={["admin"]} />}><Route path="/users" element={<Users />} /></Route>
          <Route element={<RoleRoute roles={["driver"]} />}><Route path="/driver" element={<DriverPortal />} /></Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
