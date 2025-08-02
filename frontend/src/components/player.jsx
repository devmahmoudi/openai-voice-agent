import { useState, useRef, useEffect } from "react";
import { useVoiceAgent } from "../contexts/VoiceAgentContext";
import MicVisualizer from "./MicVisualizer";
import { Volume2 } from "lucide-react";

const Player = ({ audioBlob, onPlaybackComplete }) => {
  const { session } = useVoiceAgent();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyser, setAnalyser] = useState(null);

  useEffect(() => {
    if (!audioBlob) return;

    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    setAnalyser(analyser);

    audioRef.current = new Audio(URL.createObjectURL(audioBlob));
    const source = audioContext.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioRef.current.onended = () => {
      setIsPlaying(false);
      onPlaybackComplete();
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioBlob, onPlaybackComplete]);

  const togglePlayback = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <MicVisualizer analyser={analyser}>
        <button
          onClick={togglePlayback}
          className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isPlaying ? "bg-green-500 animate-pulse" : "bg-blue-500"
          } text-white`}
        >
          <Volume2 size={24} />
        </button>
      </MicVisualizer>
      <p className="text-sm text-gray-600">
        {isPlaying ? "Playing..." : "Tap to play"}
      </p>
    </div>
  );
};

export default Player;
