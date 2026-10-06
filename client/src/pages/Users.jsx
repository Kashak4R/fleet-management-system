import { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";
import Modal from "../components/Modal.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const blankForm = {
  name: "",
  email: "",
  password: "",
  role: "manager",
  driver: "",
  isActive: true,
};

function displayDate(value) {
  return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Never";
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(blankForm);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  async function loadData() {
    setLoading(true);
    try {
      const [usersResponse, driversResponse] = await Promise.all([
        api.get("/users"),
        api.get("/drivers"),
      ]);
      setUsers(usersResponse.data);
      setDrivers(driversResponse.data);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to load users" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => JSON.stringify(user).toLowerCase().includes(term));
  }, [search, users]);

  function openCreate() {
    setEditing(null);
    setForm(blankForm);
    setMessage({ type: "", text: "" });
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      driver: user.driver?._id || "",
      isActive: user.isActive !== false,
    });
    setMessage({ type: "", text: "" });
    setModalOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    const payload = { ...form, driver: form.role === "driver" ? form.driver : null };
    if (editing && !payload.password) delete payload.password;
    try {
      if (editing) await api.put(`/users/${editing._id}`, payload);
      else await api.post("/users", payload);
      setModalOpen(false);
      setMessage({ type: "success", text: `User ${editing ? "updated" : "created"} successfully` });
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to save user" });
    }
  }

  async function remove(user) {
    if (!window.confirm(`Delete the account for ${user.name}?`)) return;
    try {
      await api.delete(`/users/${user._id}`);
      setMessage({ type: "success", text: "User deleted" });
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to delete user" });
    }
  }

  return (
    <div>
      <header className="page-header compact">
        <div>
          <span className="eyebrow">ACCESS CONTROL</span>
          <h1>User Management</h1>
          <p>Create secure accounts and control what each team member can access.</p>
        </div>
        <button className="primary-button" onClick={openCreate}>＋ Add User</button>
      </header>

      {message.text && <div className={`alert ${message.type}`}>{message.text}</div>}

      <article className="panel resource-panel">
        <div className="toolbar">
          <div className="search-box">⌕<input placeholder="Search users..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <span className="record-count">{filteredUsers.length} accounts</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Role</th><th>Driver profile</th><th>Status</th><th>Last login</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="empty-cell">Loading...</td></tr> : filteredUsers.length ? filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td><strong>{user.name}</strong><small>{user.email}</small></td>
                  <td><span className="role-pill">{user.role}</span></td>
                  <td>{user.driver?.name || "—"}</td>
                  <td><StatusBadge value={user.isActive === false ? "inactive" : "active"} /></td>
                  <td>{displayDate(user.lastLogin)}</td>
                  <td className="actions"><button className="text-button" onClick={() => openEdit(user)}>Edit</button><button className="text-button danger" onClick={() => remove(user)}>Delete</button></td>
                </tr>
              )) : <tr><td colSpan="6" className="empty-cell">No user accounts found.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>

      {modalOpen && (
        <Modal title={`${editing ? "Edit" : "Add"} User`} onClose={() => setModalOpen(false)}>
          <form className="resource-form" onSubmit={save}>
            <div className="form-grid">
              <label>Full name<span className="required"> *</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
              <label>Email<span className="required"> *</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
              <label>{editing ? "New password (optional)" : "Password"}<span className="required">{editing ? "" : " *"}</span><input type="password" minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!editing} /></label>
              <label>Role<span className="required"> *</span><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value, driver: event.target.value === "driver" ? form.driver : "" })} required><option value="admin">Admin</option><option value="manager">Fleet Manager</option><option value="driver">Driver</option></select></label>
              {form.role === "driver" && <label>Driver profile<span className="required"> *</span><select value={form.driver} onChange={(event) => setForm({ ...form, driver: event.target.value })} required><option value="">Select driver</option>{drivers.map((driver) => <option key={driver._id} value={driver._id}>{driver.name} · {driver.licenseNumber}</option>)}</select></label>}
              <label>Account status<select value={String(form.isActive)} onChange={(event) => setForm({ ...form, isActive: event.target.value === "true" })}><option value="true">Active</option><option value="false">Inactive</option></select></label>
            </div>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-button">Save User</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
