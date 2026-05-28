/**
 * useLiveKitRoom - hook to connect to a LiveKit room and manage participants/tracks.
 * Handles: join, leave, local camera/mic, screen share, and remote participant tracks
 * for the video grid.
 * Uses Room API: new Room(), room.connect(url, token), enableCameraAndMicrophone().
 */
import { useState, useCallback } from "react";
import {
  Room,
  RoomEvent,
  Track,
  TrackEvent,
} from "livekit-client";

/** Build participant slot from identity and tracks */
function participantSlot(identity, isLocal, videoTrack = null, audioTrack = null, screenTrack = null) {
  return { identity, isLocal, videoTrack, audioTrack, screenTrack };
}

/** Get track source: camera, microphone, or screen */
function getTrackSlot(track) {
  if (!track) return null;
  if (track.source === Track.Source.ScreenShare) return "screenTrack";
  if (track.kind === "video") return "videoTrack";
  if (track.kind === "audio") return "audioTrack";
  return null;
}

/** Backend API base URL for token and other API calls */
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000";

export function useLiveKitRoom() {
  const [room, setRoom] = useState(null);
  const [connectionState, setConnectionState] = useState("disconnected");
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [muteState, setMuteState] = useState({ mic: true, camera: true });

  const updateParticipant = useCallback((identity, isLocal, updater) => {
    setParticipants((prev) => {
      const idx = prev.findIndex((p) => p.identity === identity);
      const current = idx >= 0 ? prev[idx] : participantSlot(identity, isLocal);
      const next = { ...current, ...updater(current) };
      if (idx >= 0) {
        const out = [...prev];
        out[idx] = next;
        return out;
      }
      return [...prev, next];
    });
  }, []);

  const removeParticipant = useCallback((identity) => {
    setParticipants((prev) => prev.filter((p) => p.identity !== identity));
  }, []);

  const join = useCallback(
    async (name, roomId, role) => {
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE}/getToken?room=${encodeURIComponent(roomId)}&name=${encodeURIComponent(name)}&role=${encodeURIComponent(role || "host")}`
        );
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Token request failed: ${response.status}`);
        }
        const data = await response.json();
        // Ensure token is a string (LiveKit expects JWT string; passing an object causes access_token=[object Object])
        const token =
          typeof data.token === "string"
            ? data.token
            : data.token?.jwt ?? data.token?.access_token ?? null;
        const url = typeof data.url === "string" ? data.url : data.url ?? null;
        if (!token || !url) {
          throw new Error(
            "Invalid token response: missing token or url (backend should return { token: string, url: string })"
          );
        }
        const lkRoom = new Room();
        setRoom(lkRoom);
        setConnectionState(lkRoom.state);

        lkRoom.on(RoomEvent.ConnectionStateChanged, (state) => setConnectionState(state));

        // Local track published (camera, mic, or screen) - update grid and mute state
        lkRoom.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
          const track = publication.track;
          if (track) {
            const slot = getTrackSlot(track);
            if (slot) updateParticipant(participant.identity, true, (p) => ({ ...p, [slot]: track }));
            if (track.kind === "audio" || track.kind === "video") {
              const key = track.kind === "audio" ? "mic" : "camera";
              track.on(TrackEvent.Muted, () => setMuteState((s) => ({ ...s, [key]: true })));
              track.on(TrackEvent.Unmuted, () => setMuteState((s) => ({ ...s, [key]: false })));
              setMuteState((s) => ({ ...s, [key]: track.isMuted }));
            }
          }
        });

        await lkRoom.connect(url, token);

        // Local participant in grid (identity is set from token after connect)
        const localIdentity = lkRoom.localParticipant.identity;
        setParticipants((prev) => [...prev, participantSlot(localIdentity, true)]);

        // Publish camera and microphone for all roles (host/viewer).
        setMuteState({ mic: false, camera: false });
        await lkRoom.localParticipant.enableCameraAndMicrophone();

        // Remote participant connected
        lkRoom.on(RoomEvent.ParticipantConnected, (participant) => {
          setParticipants((prev) => [...prev, participantSlot(participant.identity, false)]);
        });

        lkRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
          removeParticipant(participant.identity);
        });

        // Add existing remote participants and their already-subscribed tracks
        setParticipants((prev) => {
          const next = [...prev];
          lkRoom.remoteParticipants.forEach((participant) => {
            let slot = participantSlot(participant.identity, false);
            participant.trackPublications.forEach((pub) => {
              if (pub.track) {
                const key = getTrackSlot(pub.track);
                if (key) slot = { ...slot, [key]: pub.track };
              }
            });
            next.push(slot);
          });
          return next;
        });

        // Subscribed to a remote track - add to grid
        lkRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          const slot = getTrackSlot(track);
          if (slot) updateParticipant(participant.identity, false, (p) => ({ ...p, [slot]: track }));
        });

        lkRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          const slot = getTrackSlot(track);
          if (slot) updateParticipant(participant.identity, false, (p) => ({ ...p, [slot]: null }));
        });

        // Local track published (e.g. screen share)
        lkRoom.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
          const track = publication.track;
          if (track) {
            const slot = getTrackSlot(track);
            if (slot) updateParticipant(participant.identity, true, (p) => ({ ...p, [slot]: track }));
          }
        });

        lkRoom.on(RoomEvent.LocalTrackUnpublished, (publication, participant) => {
          const track = publication.track;
          if (track) {
            const slot = getTrackSlot(track);
            if (slot) updateParticipant(participant.identity, true, (p) => ({ ...p, [slot]: null }));
          }
        });

        return lkRoom;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [updateParticipant, removeParticipant]
  );

  const leave = useCallback(() => {
    if (room) {
      room.disconnect(true);
      setRoom(null);
      setParticipants([]);
      setConnectionState("disconnected");
      setMuteState({ mic: true, camera: true });
    }
  }, [room]);

  const toggleMic = useCallback(() => {
    if (!room) return;
    const pub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
    if (pub?.track) {
      pub.track.enable(!pub.track.isMuted);
      setMuteState((s) => ({ ...s, mic: !s.mic }));
    }
  }, [room]);

  const toggleCamera = useCallback(() => {
    if (!room) return;
    const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    if (pub?.track) {
      pub.track.enable(!pub.track.isMuted);
      setMuteState((s) => ({ ...s, camera: !s.camera }));
    }
  }, [room]);

  const startScreenShare = useCallback(async () => {
    if (!room) return;
    await room.localParticipant.setScreenShareEnabled(true);
  }, [room]);

  const stopScreenShare = useCallback(async () => {
    if (!room) return;
    await room.localParticipant.setScreenShareEnabled(false);
  }, [room]);

  const isMicMuted = room ? muteState.mic : true;
  const isCameraOff = room ? muteState.camera : true;
  const isScreenSharing = room
    ? room.localParticipant.isScreenShareEnabled
    : false;

  return {
    room,
    connectionState,
    participants,
    error,
    join,
    leave,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
  };
}
