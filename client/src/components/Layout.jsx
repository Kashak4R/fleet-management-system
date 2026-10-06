import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navigation = [
  { path: "/dashboard", label: "Dashboard", icon: "▦", roles: ["admin", "manager"] },
  { path: "/vehicles", label: "Vehicles", icon: "▰", roles: ["admin", "manager"] },
  { path: "/drivers", label: "Drivers", icon: "◉", roles: ["admin", "manager"] },
  { path: "/trips", label: "Trips", icon: "➜", roles: ["admin", "manager"] },
  { path: "/fuel", label: "Fuel Logs", icon: "◒", roles: ["admin", "manager"] },
  { path: "/maintenance", label: "Maintenance", icon: "⚙", roles: ["admin", "manager"] },
  { path: "/reports", label: "Reports", icon: "▥", roles: ["admin", "manager"] },
  { path: "/users", label: "Users", icon: "♙", roles: ["admin"] },
  { path: "/driver", label: "My Workspace", icon: "◉", roles: ["driver"] },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">F</span>
          <div>
            <strong>FleetFlow</strong>
            <small>Management System</small>
          </div>
        </div>

        <nav>
          {navigation.filter((item) => item.roles.includes(user?.role)).map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">{user?.name?.[0] || "U"}</div>
          <div className="user-copy">
            <strong>{user?.name}</strong>
            <small>{user?.role}</small>
          </div>
          <button className="icon-button" onClick={logout} title="Log out">↪</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
