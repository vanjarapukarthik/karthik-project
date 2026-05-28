/**
 * VideoGrid - container for all participant videos in a responsive grid.
 * Renders a ParticipantTile for each participant from the room hook.
 */
import { ParticipantTile } from "./ParticipantTile.jsx";

export function VideoGrid({ participants }) {
  if (!participants?.length) {
    return (
      <div className="video-grid video-grid--empty">
        <p>No participants in the call yet.</p>
      </div>
    );
  }

  return (
    <div className="video-grid">
      {participants.map((p) => (
        <ParticipantTile
          key={p.identity}
          identity={p.identity}
          isLocal={p.isLocal}
          videoTrack={p.videoTrack}
          audioTrack={p.audioTrack}
          screenTrack={p.screenTrack}
        />
      ))}
    </div>
  );
}
