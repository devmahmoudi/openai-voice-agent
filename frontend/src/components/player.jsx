import { useEffect, useRef, useState } from "react";
import MicVisualizer from "./MicVisualizer";
import { Volume2 } from "lucide-react";

const Player = ({ audioBlob, isAgentSpeaking, onPlaybackComplete }) => {
  const audioRef = useRef(null);
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
      onPlaybackComplete();
    };

    audioRef.current.addEventListener("ended", handleEnd);

    audioRef.current.play().catch((error) => {
      console.error("Playback failed:", error);
    });

    return () => {
      audioRef.current?.removeEventListener("ended", handleEnd);
      audioRef.current?.pause();
      audioContext.close();
    };
  }, [audioBlob, onPlaybackComplete]);

  return (
    <div className="flex flex-col items-center gap-4">
      <MicVisualizer analyser={analyser}>
        <button className="w-16 h-16 rounded-full flex items-center justify-center bg-green-500 animate-pulse text-white">
          <Volume2 size={24} />
        </button>
      </MicVisualizer>
      <p className="text-sm text-gray-600">
        {isAgentSpeaking ? "AI is speaking..." : "Playing response..."}
      </p>
    </div>
  );
};

export default Player;
