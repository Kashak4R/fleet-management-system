import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === "driver" ? "/driver" : "/dashboard"} replace />;
}
