/**
 * Main App - join form when disconnected, meeting view (video grid + controls + chat) when connected.
 */
import { useState } from "react";
import { useLiveKitRoom } from "./hooks/useLiveKitRoom.js";
import { JoinForm } from "./components/JoinForm.jsx";
import { VideoGrid } from "./components/VideoGrid.jsx";
import { MeetingControls } from "./components/MeetingControls.jsx";
import { HostControls } from "./components/HostControls.jsx";
import { ChatPanel } from "./components/ChatPanel.jsx";
import "./App.css";

export default function App() {
  const [joinedAs, setJoinedAs] = useState(null); // { name, room, role }
  const {
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
  } = useLiveKitRoom();

  const handleJoin = async ({ name, room: roomId, role }) => {
    setJoinedAs(null);
    await join(name, roomId, role);
    setJoinedAs({ name, room: roomId, role });
  };

  const handleLeave = () => {
    leave();
    setJoinedAs(null);
  };

  const isInCall = connectionState === "connected" && room;

  return (
    <div className="app">
      {!isInCall ? (
        <div className="app-join">
          <JoinForm
            onSubmit={handleJoin}
            loading={connectionState === "connecting"}
            error={error}
          />
        </div>
      ) : (
        <div className="app-meeting">
          <header className="app-header">
            <span className="app-header-room">Room: {joinedAs?.room}</span>
            <span className="app-header-you">{joinedAs?.name} ({joinedAs?.role})</span>
          </header>
          <div className="app-main">
            <div className="app-video-section">
              <VideoGrid participants={participants} />
              <MeetingControls
                role={joinedAs?.role}
                isMicMuted={isMicMuted}
                isCameraOff={isCameraOff}
                isScreenSharing={isScreenSharing}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onStartScreenShare={startScreenShare}
                onStopScreenShare={stopScreenShare}
                onLeave={handleLeave}
              />
              {joinedAs?.role === "host" && (
                <HostControls
                  roomName={joinedAs.room}
                  participants={participants}
                />
              )}
            </div>
            <aside className="app-chat-section">
              <ChatPanel room={room} localIdentity={joinedAs?.name} />
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
