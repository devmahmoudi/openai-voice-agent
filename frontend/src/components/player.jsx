import { useRef, useState, useEffect } from "react";
import MicVisualizer from "./MicVisualizer";
import { Volume2 } from "lucide-react";

const Player = ({ audioBlob, onPlaybackComplete, onNewRecording }) => {
  const [analyser, setAnalyser] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      const newAnalyser = audioContextRef.current.createAnalyser();
      setAnalyser(newAnalyser);
      setIsInitialized(true);

      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
      audioRef.current.addEventListener("ended", handleAudioEnd);
      audioRef.current.addEventListener("error", handleAudioError);

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeEventListener("ended", handleAudioEnd);
          audioRef.current.removeEventListener("error", handleAudioError);
          audioRef.current.src = "";
        }
        if (sourceRef.current) {
          sourceRef.current.disconnect();
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
    } catch (err) {
      setError("Failed to initialize audio: " + err.message);
    }
  }, []);

  useEffect(() => {
    if (audioBlob && isInitialized) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioUrl;
      setError(null);
      startPlaying();
    }
  }, [audioBlob, isInitialized]);

  const handleAudioEnd = () => {
    setIsPlaying(false);
    cleanupSource();
    onPlaybackComplete();
  };

  const handleAudioError = () => {
    const errorMsg = audioRef.current.error
      ? `Error ${audioRef.current.error.code}: ${audioRef.current.error.message}`
      : "Unknown playback error";
    setError(errorMsg);
    setIsPlaying(false);
    setIsLoading(false);
    cleanupSource();
  };

  const cleanupSource = () => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
  };

  const startPlaying = async () => {
    if (!audioBlob || !analyser) {
      setError("Audio not ready for playback");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      cleanupSource();

      sourceRef.current = audioContextRef.current.createMediaElementSource(
        audioRef.current
      );
      sourceRef.current.connect(analyser);
      analyser.connect(audioContextRef.current.destination);

      await audioRef.current.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Playback error:", err);
      setError("Playback failed: " + err.message);
      setIsPlaying(false);
      setIsLoading(false);
      cleanupSource();
    }
  };

  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    cleanupSource();
  };

  return (
    <div className="player-container">
      <MicVisualizer analyser={analyser}>
        <Volume2
          className={`cursor-pointer p-3 box-content rounded-full ${
            isLoading
              ? "bg-gray-500"
              : isPlaying
              ? "bg-green-500 animate-pulse"
              : audioBlob
              ? "bg-blue-500"
              : "bg-gray-300"
          }`}
          onClick={() => {
            if (isLoading || !audioBlob) return;
            isPlaying ? stopPlaying() : startPlaying();
          }}
        />
      </MicVisualizer>
      <div className="text-sm mt-2 text-center">
        {isLoading ? "Loading..." : isPlaying ? "Playing..." : "Audio ready"}
      </div>
      {error && (
        <div className="text-red-500 text-sm mt-2 text-center">{error}</div>
      )}
    </div>
  );
};

export default Player;
