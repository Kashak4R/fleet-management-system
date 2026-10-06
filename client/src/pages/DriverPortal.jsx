import { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";
import Modal from "../components/Modal.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

function displayDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

export default function DriverPortal() {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [tripModal, setTripModal] = useState(null);
  const [tripForm, setTripForm] = useState({ status: "planned", distance: 0 });
  const [fuelModal, setFuelModal] = useState(null);
  const [fuelForm, setFuelForm] = useState({ date: new Date().toISOString().slice(0, 10), quantity: "", pricePerLitre: "", odometer: "", vendor: "" });

  async function loadOverview() {
    try {
      const { data: overview } = await api.get("/driver/overview");
      setData(overview);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to load driver dashboard" });
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const activeTrips = useMemo(() => data?.trips?.filter((trip) => ["planned", "ongoing"].includes(trip.status)) || [], [data]);

  function openTrip(trip) {
    setTripModal(trip);
    setTripForm({ status: trip.status, distance: trip.distance || 0 });
  }

  function openFuel(trip) {
    setFuelModal(trip);
    setFuelForm({
      date: new Date().toISOString().slice(0, 10),
      quantity: "",
      pricePerLitre: "",
      odometer: trip.vehicle?.odometer || "",
      vendor: "",
    });
  }

  async function saveTrip(event) {
    event.preventDefault();
    try {
      await api.put(`/driver/trips/${tripModal._id}`, tripForm);
      setTripModal(null);
      setMessage({ type: "success", text: "Trip progress updated successfully" });
      await loadOverview();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to update trip" });
    }
  }

  async function saveFuel(event) {
    event.preventDefault();
    try {
      await api.post("/driver/fuel", { ...fuelForm, vehicle: fuelModal.vehicle?._id });
      setFuelModal(null);
      setMessage({ type: "success", text: "Fuel entry submitted successfully" });
      await loadOverview();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to submit fuel entry" });
    }
  }

  if (!data && !message.text) return <div className="empty-cell">Loading your workspace...</div>;

  return (
    <div>
      <header className="page-header driver-header">
        <div><span className="eyebrow">DRIVER WORKSPACE</span><h1>Hello, {data?.driver?.name || "Driver"}</h1><p>Review assignments, update trip progress, and submit fuel records.</p></div>
        {data?.driver && <div className="profile-chip"><span>Licence</span><strong>{data.driver.licenseNumber}</strong><small>Valid until {displayDate(data.driver.licenseExpiry)}</small></div>}
      </header>

      {message.text && <div className={`alert ${message.type}`}>{message.text}</div>}

      <section className="metrics-grid driver-metrics">
        <article className="metric-card"><span className="metric-icon blue">↗</span><div><small>Total assignments</small><strong>{data?.metrics?.totalTrips || 0}</strong></div></article>
        <article className="metric-card"><span className="metric-icon amber">●</span><div><small>Active trips</small><strong>{data?.metrics?.activeTrips || 0}</strong></div></article>
        <article className="metric-card"><span className="metric-icon green">✓</span><div><small>Completed trips</small><strong>{data?.metrics?.completedTrips || 0}</strong></div></article>
        <article className="metric-card"><span className="metric-icon violet">km</span><div><small>Total distance</small><strong>{Number(data?.metrics?.totalDistance || 0).toLocaleString()} km</strong></div></article>
      </section>

      <section className="driver-grid">
        <article className="panel">
          <div className="panel-heading"><div><h2>My trips</h2><p>Only assignments linked to your driver profile are shown</p></div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Trip</th><th>Vehicle</th><th>Date</th><th>Distance</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{data?.trips?.length ? data.trips.map((trip) => (
                <tr key={trip._id}>
                  <td><strong>{trip.title}</strong><small>{trip.origin} to {trip.destination}</small></td>
                  <td><strong>{trip.vehicle?.registrationNumber}</strong><small>{trip.vehicle?.make} {trip.vehicle?.model}</small></td>
                  <td>{displayDate(trip.startDate)}</td><td>{trip.distance || 0} km</td><td><StatusBadge value={trip.status} /></td>
                  <td className="actions"><button className="text-button" onClick={() => openTrip(trip)}>Update</button>{["planned", "ongoing"].includes(trip.status) && <button className="text-button" onClick={() => openFuel(trip)}>Add fuel</button>}</td>
                </tr>
              )) : <tr><td colSpan="6" className="empty-cell">No trips have been assigned to you.</td></tr>}</tbody>
            </table>
          </div>
        </article>

        <aside className="driver-side-stack">
          <article className="panel compact-panel"><div className="panel-heading"><div><h2>Active vehicles</h2><p>Vehicles available for fuel submission</p></div></div><div className="assignment-list">{activeTrips.length ? activeTrips.map((trip) => <div className="assignment-item" key={trip._id}><div><strong>{trip.vehicle?.registrationNumber}</strong><small>{trip.vehicle?.make} {trip.vehicle?.model}</small></div><StatusBadge value={trip.status} /></div>) : <p className="empty-cell">No active vehicle assignment</p>}</div></article>
          <article className="panel compact-panel"><div className="panel-heading"><div><h2>Service alerts</h2><p>Maintenance related to assigned vehicles</p></div></div><div className="assignment-list">{data?.maintenance?.length ? data.maintenance.map((item) => <div className="assignment-item" key={item._id}><div><strong>{item.serviceType}</strong><small>{item.vehicle?.registrationNumber} · {displayDate(item.scheduledDate)}</small></div><StatusBadge value={item.status} /></div>) : <p className="empty-cell">No service alerts</p>}</div></article>
        </aside>
      </section>

      {tripModal && <Modal title="Update Trip Progress" onClose={() => setTripModal(null)}><form className="resource-form" onSubmit={saveTrip}><div className="form-grid"><label>Status<select value={tripForm.status} onChange={(event) => setTripForm({ ...tripForm, status: event.target.value })}><option value="planned">Planned</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><label>Distance (km)<input type="number" min="0" value={tripForm.distance} onChange={(event) => setTripForm({ ...tripForm, distance: event.target.value })} /></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setTripModal(null)}>Cancel</button><button className="primary-button">Update Trip</button></div></form></Modal>}

      {fuelModal && <Modal title="Submit Fuel Entry" onClose={() => setFuelModal(null)}><form className="resource-form" onSubmit={saveFuel}><div className="form-note"><strong>{fuelModal.vehicle?.registrationNumber}</strong> · {fuelModal.vehicle?.make} {fuelModal.vehicle?.model}</div><div className="form-grid"><label>Date<input type="date" value={fuelForm.date} onChange={(event) => setFuelForm({ ...fuelForm, date: event.target.value })} required /></label><label>Quantity (litres)<input type="number" min="0.1" step="0.1" value={fuelForm.quantity} onChange={(event) => setFuelForm({ ...fuelForm, quantity: event.target.value })} required /></label><label>Price per litre<input type="number" min="0" step="0.01" value={fuelForm.pricePerLitre} onChange={(event) => setFuelForm({ ...fuelForm, pricePerLitre: event.target.value })} required /></label><label>Odometer (km)<input type="number" min="0" value={fuelForm.odometer} onChange={(event) => setFuelForm({ ...fuelForm, odometer: event.target.value })} required /></label><label className="full-field">Fuel station<input value={fuelForm.vendor} onChange={(event) => setFuelForm({ ...fuelForm, vendor: event.target.value })} /></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setFuelModal(null)}>Cancel</button><button className="primary-button">Submit Fuel</button></div></form></Modal>}
    </div>
  );
}
