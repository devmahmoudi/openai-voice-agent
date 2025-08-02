import { useState } from "react";
import "./App.css";
import Recorder from "./components/Recorder";
import Player from "./components/player";
import { VoiceAgentProvider } from "./contexts/VoiceAgentContext";

function App() {
  const [key, setKey] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const handlePlaybackComplete = () => {
    setRecordedAudio(null);
    setKey((prev) => prev + 1);
  };

  return (
    <VoiceAgentProvider>
      <div className="flex gap-4 p-4" key={key}>
        {!recordedAudio ? (
          <Recorder
            onRecordingComplete={(audioBlob) => setRecordedAudio(audioBlob)}
          />
        ) : (
          <Player
            audioBlob={recordedAudio}
            onPlaybackComplete={handlePlaybackComplete}
          />
        )}
      </div>
    </VoiceAgentProvider>
  );
}

export default App;
