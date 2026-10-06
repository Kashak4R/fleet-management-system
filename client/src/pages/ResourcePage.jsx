import { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";
import Modal from "../components/Modal.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function displayDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN") : "—";
}

function toDateInput(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function buildInitial(fields, record = null) {
  return Object.fromEntries(fields.map((field) => {
    let value = record?.[field.name] ?? "";
    if (field.type === "relation" && typeof value === "object") value = value?._id || "";
    if (field.type === "date") value = toDateInput(value);
    return [field.name, value];
  }));
}

export default function ResourcePage({ config }) {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [relations, setRelations] = useState({});
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(buildInitial(config.fields));
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  async function loadRecords() {
    setLoading(true);
    try {
      const { data } = await api.get(config.endpoint);
      setRecords(data);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Could not load records" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSearch("");
    setEditing(null);
    setModalOpen(false);
    setForm(buildInitial(config.fields));
    loadRecords();

    const relationFields = config.fields.filter((field) => field.type === "relation");
    Promise.all(relationFields.map(async (field) => {
      const { data } = await api.get(field.endpoint);
      return [field.name, data];
    })).then((entries) => setRelations(Object.fromEntries(entries))).catch(() => {});
  }, [config]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(term));
  }, [records, search]);

  function openCreate() {
    setEditing(null);
    setForm(buildInitial(config.fields));
    setMessage({ type: "", text: "" });
    setModalOpen(true);
  }

  function openEdit(record) {
    setEditing(record);
    setForm(buildInitial(config.fields, record));
    setMessage({ type: "", text: "" });
    setModalOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    try {
      if (editing) await api.put(`${config.endpoint}/${editing._id}`, form);
      else await api.post(config.endpoint, form);
      setModalOpen(false);
      setMessage({ type: "success", text: `${config.singular} ${editing ? "updated" : "created"} successfully` });
      await loadRecords();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to save the record" });
    }
  }

  async function remove(record) {
    if (!window.confirm(`Delete this ${config.singular.toLowerCase()}?`)) return;
    try {
      await api.delete(`${config.endpoint}/${record._id}`);
      setMessage({ type: "success", text: `${config.singular} deleted` });
      await loadRecords();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to delete the record" });
    }
  }

  function cellValue(record, column) {
    if (column.render) return column.render(record);
    if (column.date) return displayDate(record[column.key]);
    return record[column.key] ?? "—";
  }

  return (
    <div>
      <header className="page-header compact">
        <div><span className="eyebrow">FLEET OPERATIONS</span><h1>{config.title}</h1><p>{config.description}</p></div>
        {user?.role !== "driver" && <button className="primary-button" onClick={openCreate}>＋ Add {config.singular}</button>}
      </header>

      {message.text && <div className={`alert ${message.type}`}>{message.text}</div>}

      <article className="panel resource-panel">
        <div className="toolbar">
          <div className="search-box">⌕<input placeholder={`Search ${config.title.toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <span className="record-count">{filtered.length} records</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>{config.columns.map((column) => <th key={column.key}>{column.label}</th>)}<th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={config.columns.length + 1} className="empty-cell">Loading...</td></tr> : filtered.length ? filtered.map((record) => (
                <tr key={record._id}>
                  {config.columns.map((column) => <td key={column.key}>{column.status ? <StatusBadge value={record[column.key]} /> : cellValue(record, column)}</td>)}
                  <td className="actions">
                    <button className="text-button" onClick={() => openEdit(record)}>Edit</button>
                    {user?.role === "admin" && <button className="text-button danger" onClick={() => remove(record)}>Delete</button>}
                  </td>
                </tr>
              )) : <tr><td colSpan={config.columns.length + 1} className="empty-cell">No records found. Add the first one.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>

      {modalOpen && (
        <Modal title={`${editing ? "Edit" : "Add"} ${config.singular}`} onClose={() => setModalOpen(false)}>
          <form className="resource-form" onSubmit={save}>
            <div className="form-grid">
              {config.fields.map((field) => (
                <label key={field.name} className={field.type === "textarea" ? "full-field" : ""}>
                  {field.label}{field.required && <span className="required"> *</span>}
                  {field.type === "select" ? (
                    <select value={form[field.name]} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} required={field.required}>
                      <option value="">Select {field.label.toLowerCase()}</option>
                      {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : field.type === "relation" ? (
                    <select value={form[field.name]} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} required={field.required}>
                      <option value="">Select {field.label.toLowerCase()}</option>
                      {(relations[field.name] || []).map((option) => <option key={option._id} value={option._id}>{field.optionLabel(option)}</option>)}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea rows="3" value={form[field.name]} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} required={field.required} />
                  ) : (
                    <input type={field.type || "text"} step={field.step} value={form[field.name]} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} required={field.required} />
                  )}
                </label>
              ))}
            </div>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-button">Save {config.singular}</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

