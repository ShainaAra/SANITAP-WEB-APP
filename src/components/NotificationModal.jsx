import "./NotificationModal.css";

export default function NotificationModal({ data, onClose }) {
  if (!data) return null;

  return (
    <div className="notif-overlay">
      <div className="notif-modal">
        <h1>{data.title}</h1>

        <p className="notif-body">
          <strong>{data.product}</strong> {data.message}
        </p>

        <button onClick={onClose}>OK</button>
      </div>
    </div>
  );
}