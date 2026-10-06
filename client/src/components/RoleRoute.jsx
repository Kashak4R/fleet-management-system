import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RoleRoute({ roles }) {
  const { user } = useAuth();
  if (roles.includes(user?.role)) return <Outlet />;
  return <Navigate to={user?.role === "driver" ? "/driver" : "/dashboard"} replace />;
}
