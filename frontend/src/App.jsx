import { useState, useEffect } from "react";
import "./App.css";
import Recorder from "./components/Recorder";
import {
  VoiceAgentProvider,
  useVoiceAgent,
} from "./contexts/VoiceAgentContext";
import Player from "./components/Player";

function App() {
  return (
    <VoiceAgentProvider>
      <VoiceInterface />
    </VoiceAgentProvider>
  );
}

function VoiceInterface() {
  const { isAgentSpeaking, audioQueue, clearAudioQueue } = useVoiceAgent();
  const [currentAudio, setCurrentAudio] = useState(null);

  useEffect(() => {
    if (audioQueue.length > 0 && !currentAudio) {
      const audioBlob = new Blob([audioQueue[0]], { type: "audio/mp3" });
      setCurrentAudio(audioBlob);
      clearAudioQueue();
    }
  }, [audioQueue, currentAudio, clearAudioQueue]);

  const handlePlaybackComplete = () => {
    setCurrentAudio(null);
  };

  return (
    <div className="flex gap-4 p-4">
      {currentAudio || isAgentSpeaking ? (
        <Player
          audioBlob={currentAudio}
          isAgentSpeaking={isAgentSpeaking}
          onPlaybackComplete={handlePlaybackComplete}
        />
      ) : (
        <Recorder />
      )}
    </div>
  );
}

export default App;
