import { useEffect, useRef, useState } from "react";
import MicVisualizer from "./MicVisualizer";
import { Volume2 } from "lucide-react";
import { useVoiceAgent } from "../contexts/VoiceAgentContext";

const Player = ({ audioBlob, onPlaybackComplete }) => {
  const { isAgentSpeaking } = useVoiceAgent();
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

    const handleEnd = () => {
      setIsPlaying(false);
      onPlaybackComplete();
    };

    audioRef.current.addEventListener("ended", handleEnd);

    // Auto-play when agent is speaking
    if (isAgentSpeaking) {
      const playAudio = async () => {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Error playing audio:", error);
        }
      };
      playAudio();
    }

    return () => {
      audioRef.current?.removeEventListener("ended", handleEnd);
      audioRef.current?.pause();
    };
  }, [audioBlob, isAgentSpeaking, onPlaybackComplete]);

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
        {isAgentSpeaking
          ? "AI is speaking..."
          : isPlaying
          ? "Playing..."
          : "Tap to play"}
      </p>
    </div>
  );
};

export default Player;
