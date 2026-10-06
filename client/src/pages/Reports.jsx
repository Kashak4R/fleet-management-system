import { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function Reports() {
  const [data, setData] = useState({ vehicles: [], trips: [], fuel: [], maintenance: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/vehicles"), api.get("/trips"), api.get("/fuel"), api.get("/maintenance")])
      .then(([vehicles, trips, fuel, maintenance]) => setData({ vehicles: vehicles.data, trips: trips.data, fuel: fuel.data, maintenance: maintenance.data }))
      .catch((requestError) => setError(requestError.response?.data?.message || "Reports could not be loaded"));
  }, []);

  const reportRows = useMemo(() => data.vehicles.map((vehicle) => {
    const vehicleTrips = data.trips.filter((trip) => trip.vehicle?._id === vehicle._id || trip.vehicle === vehicle._id);
    const fuelLogs = data.fuel.filter((entry) => entry.vehicle?._id === vehicle._id || entry.vehicle === vehicle._id);
    const maintenance = data.maintenance.filter((entry) => entry.vehicle?._id === vehicle._id || entry.vehicle === vehicle._id);
    return {
      registration: vehicle.registrationNumber,
      vehicle: `${vehicle.make} ${vehicle.model}`,
      status: vehicle.status,
      trips: vehicleTrips.length,
      distance: vehicleTrips.reduce((sum, trip) => sum + Number(trip.distance || 0), 0),
      fuelCost: fuelLogs.reduce((sum, entry) => sum + Number(entry.totalCost || 0), 0),
      maintenanceCost: maintenance.reduce((sum, entry) => sum + Number(entry.cost || 0), 0),
    };
  }), [data]);

  function exportReport() {
    downloadCsv("fleet-operational-report.csv", [
      ["Registration", "Vehicle", "Status", "Trips", "Distance km", "Fuel cost", "Maintenance cost"],
      ...reportRows.map((row) => [row.registration, row.vehicle, row.status, row.trips, row.distance, row.fuelCost, row.maintenanceCost]),
    ]);
  }

  return (
    <div>
      <header className="page-header compact">
        <div><span className="eyebrow">ANALYTICS</span><h1>Operational Reports</h1><p>Compare vehicle utilization, fuel spending, and maintenance cost.</p></div>
        <button className="primary-button" onClick={exportReport}>⇩ Export CSV</button>
      </header>
      {error && <div className="alert error">{error}</div>}
      <article className="panel resource-panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Registration</th><th>Vehicle</th><th>Status</th><th>Trips</th><th>Distance</th><th>Fuel cost</th><th>Maintenance</th></tr></thead>
            <tbody>
              {reportRows.length ? reportRows.map((row) => (
                <tr key={row.registration}><td><strong>{row.registration}</strong></td><td>{row.vehicle}</td><td>{row.status}</td><td>{row.trips}</td><td>{row.distance.toLocaleString()} km</td><td>₹{row.fuelCost.toLocaleString("en-IN")}</td><td>₹{row.maintenanceCost.toLocaleString("en-IN")}</td></tr>
              )) : <tr><td colSpan="7" className="empty-cell">Add vehicle records to generate this report.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

