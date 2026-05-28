
import { useState } from "react";
import { connect, createLocalTracks, createLocalScreenTracks } from "livekit-client";

export default function App() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("demo");
  const [role, setRole] = useState("host");
  const [room, setRoom] = useState(null);

  const join = async () => {
    const r = await fetch(`/token?name=${name}&room=${roomId}&role=${role}`);
    const { token, url } = await r.json();
    const lkRoom = await connect(url, token);
    setRoom(lkRoom);

    if(role !== "viewer"){
      const tracks = await createLocalTracks({ audio:true, video:true });
      tracks.forEach(t => {
        lkRoom.localParticipant.publishTrack(t);
        document.body.appendChild(t.attach());
      });
    }

    lkRoom.on("trackSubscribed", track => {
      document.body.appendChild(track.attach());
    });
  };

  const startLiveStream = async () => {
    const screenTracks = await createLocalScreenTracks({ audio:true });
    screenTracks.forEach(t => {
      room.localParticipant.publishTrack(t);
      document.body.appendChild(t.attach());
    });
  };

  return (
    <div>
      <input placeholder="Name" onChange={e=>setName(e.target.value)} />
      <select onChange={e=>setRole(e.target.value)}>
        <option value="host">Host</option>
        <option value="viewer">Viewer</option>
      </select>
      <button onClick={join}>Join</button>
      <button onClick={startLiveStream}>Start Live Stream</button>
    </div>
  );
}
