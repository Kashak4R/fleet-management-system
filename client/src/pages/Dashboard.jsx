import { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const metricConfig = [
  ["vehicleCount", "Total vehicles", "▰", "blue", "Fleet assets"],
  ["availableVehicles", "Available now", "✓", "green", "Ready to dispatch"],
  ["driverCount", "Registered drivers", "◉", "cyan", "Active workforce"],
  ["activeTrips", "Active trips", "➜", "amber", "Planned or ongoing"],
  ["maintenanceDue", "Service attention", "⚙", "red", "Upcoming or overdue"],
  ["fuelSpend", "Fuel expenditure", "₹", "violet", "All recorded entries"],
];

const vehicleColors = {
  available: "#16a66a",
  assigned: "#2378e5",
  maintenance: "#ef7c46",
  inactive: "#91a1af",
};

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function VehicleDonut({ values = {} }) {
  const entries = Object.entries(vehicleColors).map(([key, color]) => ({ key, color, value: values[key] || 0 }));
  const total = entries.reduce((sum, item) => sum + item.value, 0);
  let current = 0;
  const stops = entries.map((item) => {
    const start = current;
    current += total ? (item.value / total) * 100 : 0;
    return `${item.color} ${start}% ${current}%`;
  });
  const background = total ? `conic-gradient(${stops.join(",")})` : "#e9eef3";

  return (
    <div className="donut-layout">
      <div className="donut-chart" style={{ background }}><div><strong>{total}</strong><small>vehicles</small></div></div>
      <div className="chart-legend">{entries.map((item) => <div key={item.key}><span style={{ background: item.color }} /><label>{item.key}</label><strong>{item.value}</strong></div>)}</div>
    </div>
  );
}

function CostChart({ rows = [] }) {
  const maxValue = Math.max(1, ...rows.flatMap((row) => [row.fuel, row.maintenance]));
  return (
    <div>
      <div className="chart-key"><span><i className="key-fuel" />Fuel</span><span><i className="key-service" />Maintenance</span></div>
      <div className="cost-chart">
        {rows.map((row) => (
          <div className="cost-column" key={row.key}>
            <div className="bar-pair">
              <div className="cost-bar fuel-bar" style={{ height: `${Math.max(4, (row.fuel / maxValue) * 100)}%` }} title={`Fuel ₹${row.fuel.toLocaleString("en-IN")}`} />
              <div className="cost-bar service-bar" style={{ height: `${Math.max(4, (row.maintenance / maxValue) * 100)}%` }} title={`Maintenance ₹${row.maintenance.toLocaleString("en-IN")}`} />
            </div>
            <small>{row.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard")
      .then((response) => setData(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || "Dashboard could not be loaded"));
  }, []);

  const metrics = data?.metrics || {};
  const tripStatus = data?.analytics?.tripStatus || {};
  const totalTrips = useMemo(() => Object.values(tripStatus).reduce((sum, value) => sum + value, 0), [tripStatus]);

  return (
    <div>
      <header className="dashboard-hero">
        <div><span className="eyebrow">OPERATIONS COMMAND CENTER</span><h1>Good day, {user?.name?.split(" ")[0]}</h1><p>Live visibility across your fleet, workforce, trips, and operating costs.</p></div>
        <div className="hero-actions"><span className="live-chip"><i /> System live</span><div className="date-chip">{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })}</div></div>
      </header>

      {error && <div className="alert error">{error}</div>}

      <section className="metrics-grid">
        {metricConfig.map(([key, label, icon, color, hint]) => (
          <article className="metric-card professional-card" key={key}>
            <div className="metric-top"><span className={`metric-icon ${color}`}>{icon}</span><span className="metric-menu">•••</span></div>
            <div className="metric-copy"><small>{label}</small><strong>{key === "fuelSpend" ? `₹${Number(metrics[key] || 0).toLocaleString("en-IN")}` : metrics[key] ?? "—"}</strong><span>{hint}</span></div>
          </article>
        ))}
      </section>

      <section className="analytics-grid">
        <article className="panel analytics-panel cost-panel">
          <div className="panel-heading"><div><span className="panel-kicker">COST PERFORMANCE</span><h2>Operating expense trend</h2><p>Fuel and maintenance spending during the last six months</p></div><span className="period-pill">6 months</span></div>
          <CostChart rows={data?.analytics?.monthlyCosts || []} />
        </article>

        <article className="panel analytics-panel">
          <div className="panel-heading"><div><span className="panel-kicker">FLEET HEALTH</span><h2>Vehicle availability</h2><p>{data?.analytics?.utilizationRate || 0}% currently utilized</p></div></div>
          <VehicleDonut values={data?.analytics?.vehicleStatus} />
          <div className="utilization-row"><span>Utilization</span><div><i style={{ width: `${data?.analytics?.utilizationRate || 0}%` }} /></div><strong>{data?.analytics?.utilizationRate || 0}%</strong></div>
        </article>
      </section>

      <section className="dashboard-grid professional-grid">
        <article className="panel">
          <div className="panel-heading"><div><span className="panel-kicker">LATEST MOVEMENT</span><h2>Recent trips</h2><p>{totalTrips} trips recorded across all statuses</p></div><div className="trip-summary"><span><i className="planned-dot" />{tripStatus.planned || 0} planned</span><span><i className="ongoing-dot" />{tripStatus.ongoing || 0} ongoing</span></div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Trip</th><th>Vehicle</th><th>Driver</th><th>Status</th></tr></thead>
              <tbody>
                {data?.recentTrips?.length ? data.recentTrips.map((trip) => (
                  <tr key={trip._id}><td><strong>{trip.title}</strong><small>{trip.origin} to {trip.destination}</small></td><td>{trip.vehicle?.registrationNumber || "—"}</td><td>{trip.driver?.name || "—"}</td><td><StatusBadge value={trip.status} /></td></tr>
                )) : <tr><td colSpan="4" className="empty-cell">No trips recorded yet</td></tr>}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="attention-stack">
          <article className="panel">
            <div className="panel-heading"><div><span className="panel-kicker">SERVICE CALENDAR</span><h2>Upcoming maintenance</h2></div></div>
            <div className="maintenance-list">
              {data?.upcomingMaintenance?.length ? data.upcomingMaintenance.map((item) => (
                <div className="maintenance-item" key={item._id}><span className="service-icon">⚙</span><div><strong>{item.serviceType}</strong><small>{item.vehicle?.registrationNumber || "Vehicle"}</small></div><time>{formatDate(item.scheduledDate)}</time></div>
              )) : <p className="empty-cell">No maintenance due in the next 30 days.</p>}
            </div>
          </article>

          <article className="panel compliance-panel">
            <div className="panel-heading"><div><span className="panel-kicker">COMPLIANCE</span><h2>Expiring documents</h2></div></div>
            <div className="maintenance-list">
              {data?.complianceAlerts?.length ? data.complianceAlerts.map((item) => (
                <div className="maintenance-item" key={`${item.type}-${item.id}`}><span className="service-icon warning-icon">!</span><div><strong>{item.title}</strong><small>{item.subtitle}</small></div><time>{formatDate(item.dueDate)}</time></div>
              )) : <div className="all-clear"><span>✓</span><div><strong>All clear</strong><small>No documents expire within 60 days</small></div></div>}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
