import { useEffect, useState } from "react";
import { useVoiceAgent } from "../contexts/VoiceAgentContext";
import Player from "./Player";
import Recorder from "./Recorder";

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
export default VoiceInterface;
