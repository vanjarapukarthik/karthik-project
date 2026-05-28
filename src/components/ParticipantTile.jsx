/**
 * ParticipantTile - renders one participant's video/audio in the grid.
 * Attaches LiveKit Track to a video or audio element via ref and useEffect.
 */
import { useEffect, useRef } from "react";

export function ParticipantTile({ identity, isLocal, videoTrack, audioTrack, screenTrack }) {
  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const audioRef = useRef(null);

  // Prefer screen track for main video if sharing, else camera
  const mainVideoTrack = screenTrack || videoTrack;

  useEffect(() => {
    if (!videoRef.current) return;
    if (mainVideoTrack) {
      mainVideoTrack.attach(videoRef.current);
      return () => mainVideoTrack.detach(videoRef.current);
    }
  }, [mainVideoTrack]);

  useEffect(() => {
    if (!screenRef.current) return;
    // If we have both screen and camera, show camera in a small tile
    if (screenTrack && videoTrack && screenRef.current) {
      videoTrack.attach(screenRef.current);
      return () => videoTrack.detach(screenRef.current);
    }
  }, [screenTrack, videoTrack]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (audioTrack) {
      audioTrack.attach(audioRef.current);
      return () => audioTrack.detach(audioRef.current);
    }
  }, [audioTrack]);

  return (
    <div className="participant-tile">
      <div className="participant-video-wrap">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="participant-video"
        />
        {screenTrack && videoTrack && (
          <video
            ref={screenRef}
            autoPlay
            playsInline
            muted
            className="participant-video-pip"
          />
        )}
      </div>
      <audio ref={audioRef} autoPlay />
      <div className="participant-label">
        {identity} {isLocal ? "(You)" : ""}
      </div>
    </div>
  );
}
