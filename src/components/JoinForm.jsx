/**
 * JoinForm - form to enter name, room, role and join the meeting.
 */
export function JoinForm({ onSubmit, loading, error }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name?.value?.trim();
    const room = form.room?.value?.trim() || "demo";
    const role = form.role?.value || "host";
    if (name) onSubmit({ name, room, role });
  };

  return (
    <div className="join-form-card">
      <h1 className="join-form-title">Telehealth Platform</h1>
      <p className="join-form-subtitle">Enter your details to join the consultation</p>

      <form onSubmit={handleSubmit} className="join-form">
        <label className="join-form-label">
          Your name
          <input
            type="text"
            name="name"
            placeholder="e.g. Dr. Smith"
            required
            autoComplete="name"
            className="join-form-input"
            disabled={loading}
          />
        </label>
        <label className="join-form-label">
          Room
          <input
            type="text"
            name="room"
            placeholder="demo"
            defaultValue="demo"
            className="join-form-input"
            disabled={loading}
          />
        </label>
        <label className="join-form-label">
          Role
          <select name="role" className="join-form-select" disabled={loading}>
            <option value="host">Host (camera & mic)</option>
            <option value="viewer">Viewer (watch only)</option>
          </select>
        </label>
        {error && <p className="join-form-error" role="alert">{error}</p>}
        <button type="submit" className="join-form-submit" disabled={loading}>
          {loading ? "Joining…" : "Join meeting"}
        </button>
      </form>
    </div>
  );
}
