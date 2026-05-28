/**
 * ChatPanel - in-call chat using LiveKit data channels.
 * Sends and receives JSON messages with topic "chat" for reliable delivery.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { RoomEvent } from "livekit-client";

const CHAT_TOPIC = "chat";

export function ChatPanel({ room, localIdentity }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const listRef = useRef(null);
  const recognitionRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // Subscribe to data received (chat messages)
  useEffect(() => {
    if (!room) return;

    const handleData = (payload, participant, kind, topic) => {
      if (topic !== CHAT_TOPIC) return;
      // Skip our own messages (we add them locally when sending)
      if (participant?.identity === localIdentity) return;
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        setMessages((prev) => [
          ...prev,
          {
            id: `remote-${Date.now()}-${Math.random()}`,
            sender: data.sender ?? participant?.identity ?? "Unknown",
            text: data.text ?? "",
            ts: new Date(),
          },
        ]);
      } catch (e) {
        console.warn("Chat: failed to parse message", e);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => room.off(RoomEvent.DataReceived, handleData);
  }, [room, localIdentity]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!room || !text) return;

    const payload = JSON.stringify({
      sender: localIdentity,
      text,
    });
    const data = new TextEncoder().encode(payload);
    room.localParticipant.publishData(data, { reliable: true, topic: CHAT_TOPIC });

    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        sender: localIdentity,
        text,
        ts: new Date(),
        isLocal: true,
      },
    ]);
    setInput("");
  }, [room, localIdentity, input]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech-to-text is not supported in this browser.");
      return;
    }

    setSpeechError("");
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setInput((prev) => {
        const cleanPrev = prev.trim();
        const cleanTranscript = transcript.trim();
        if (!cleanTranscript) return prev;
        return cleanPrev ? `${cleanPrev} ${cleanTranscript}` : cleanTranscript;
      });
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setSpeechError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="chat-panel">
      <h3 className="chat-panel-title">Chat</h3>
      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 && (
          <p className="chat-placeholder">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-message ${m.isLocal ? "chat-message--local" : ""}`}
          >
            <span className="chat-message-sender">{m.sender}</span>
            <span className="chat-message-text">{m.text}</span>
          </div>
        ))}
      </div>
      <div className="chat-input-wrap">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!room}
        />
        <button
          type="button"
          className={`chat-stt ${isListening ? "chat-stt--active" : ""}`}
          onClick={toggleListening}
          disabled={!room}
          title={isListening ? "Stop speech-to-text" : "Start speech-to-text"}
        >
          {isListening ? "Stop Mic" : "Speak"}
        </button>
        <button type="button" className="chat-send" onClick={send} disabled={!room || !input.trim()}>
          Send
        </button>
      </div>
      {speechError && <p className="chat-speech-error">{speechError}</p>}
    </div>
  );
}
