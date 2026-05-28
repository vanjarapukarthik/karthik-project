/**
 * MeetingControls - toolbar for mute, camera, screen share, and leave.
 * Only shows publish controls for host role (role !== "viewer").
 */
export function MeetingControls({
  isMicMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMic,
  onToggleCamera,
  onStartScreenShare,
  onStopScreenShare,
  onLeave,
}) {
  return (
    <div className="meeting-controls">
      <>
        <button
          type="button"
          className={`control-btn ${isMicMuted ? "control-btn--muted" : ""}`}
          onClick={onToggleMic}
          title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
          aria-pressed={isMicMuted}
        >
          <span className="control-icon" aria-hidden>{isMicMuted ? "🎤" : "🔇"}</span>
          <span>{isMicMuted ? "Unmute" : "Mute"}</span>
        </button>
        <button
          type="button"
          className={`control-btn ${isCameraOff ? "control-btn--muted" : ""}`}
          onClick={onToggleCamera}
          title={isCameraOff ? "Turn camera on" : "Turn camera off"}
          aria-pressed={isCameraOff}
        >
          <span className="control-icon" aria-hidden>{isCameraOff ? "📷" : "📵"}</span>
          <span>{isCameraOff ? "Start video" : "Stop video"}</span>
        </button>
        {!isScreenSharing ? (
          <button
            type="button"
            className="control-btn"
            onClick={onStartScreenShare}
            title="Share screen"
          >
            <span className="control-icon" aria-hidden>🖥️</span>
            <span>Share screen</span>
          </button>
        ) : (
          <button
            type="button"
            className="control-btn control-btn--active"
            onClick={onStopScreenShare}
            title="Stop sharing"
          >
            <span className="control-icon" aria-hidden>🖥️</span>
            <span>Stop share</span>
          </button>
        )}
      </>
      <button
        type="button"
        className="control-btn control-btn--danger"
        onClick={onLeave}
        title="Leave meeting"
      >
        <span className="control-icon" aria-hidden>📞</span>
        <span>Leave</span>
      </button>
    </div>
  );
}
