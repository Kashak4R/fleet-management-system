export default function StatusBadge({ value }) {
  const text = String(value || "unknown");
  return <span className={`status status-${text.toLowerCase().replaceAll(" ", "-")}`}>{text}</span>;
}

