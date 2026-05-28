/**
 * HostControls - host-only actions: RTMP stream, recording, and kick participant.
 * Calls backend APIs for egress and moderation.
 */
import { useState } from "react";

export function HostControls({ roomName, participants }) {
  const [rtmpUrl, setRtmpUrl] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(null);
  const remoteParticipants = participants.filter((p) => !p.isLocal);

  const handleStartRtmp = async () => {
    const url = rtmpUrl.trim();
    if (!url) {
      setError("Enter an RTMP URL");
      return;
    }
    setError(null);
    try {
      const res = await fetch("/stream/rtmp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomName, rtmpUrl: url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed: ${res.status}`);
      }
      setStreaming(true);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleStartRecord = async () => {
    setError(null);
    try {
      const res = await fetch("/stream/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed: ${res.status}`);
      }
      setRecording(true);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleKick = async (identity) => {
    setError(null);
    try {
      const res = await fetch("/moderate/kick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomName, identity }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed: ${res.status}`);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="host-controls">
      {error && <p className="host-controls-error" role="alert">{error}</p>}
      <div className="host-controls-section">
        <h4 className="host-controls-title">Stream &amp; record</h4>
        <div className="host-controls-row">
          <input
            type="url"
            placeholder="RTMP URL (e.g. rtmp://...)"
            value={rtmpUrl}
            onChange={(e) => setRtmpUrl(e.target.value)}
            className="host-controls-input"
            disabled={streaming}
          />
          <button
            type="button"
            className="control-btn"
            onClick={handleStartRtmp}
            disabled={streaming}
          >
            {streaming ? "Streaming…" : "Start RTMP"}
          </button>
        </div>
        <button
          type="button"
          className="control-btn"
          onClick={handleStartRecord}
          disabled={recording}
        >
          {recording ? "Recording…" : "Start recording"}
        </button>
      </div>
      {remoteParticipants.length > 0 && (
        <div className="host-controls-section">
          <h4 className="host-controls-title">Moderation</h4>
          <ul className="host-controls-list">
            {remoteParticipants.map((p) => (
              <li key={p.identity} className="host-controls-list-item">
                <span>{p.identity}</span>
                <button
                  type="button"
                  className="control-btn control-btn--small control-btn--danger"
                  onClick={() => handleKick(p.identity)}
                >
                  Kick
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
