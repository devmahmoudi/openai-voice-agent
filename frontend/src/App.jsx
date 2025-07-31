import { useState } from "react";
import "./App.css";
import Player from "./components/player";
import Recorder from "./components/Recorder";

function App() {
  const [key, setKey] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState(null);

  return (
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
  );
}
export default App;
