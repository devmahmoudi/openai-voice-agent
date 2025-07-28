import "./App.css";
import MicVisualizer from "./components/MicVisualizer";
import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function App() {
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const [isMicReady, setIsMicReady] = useState(false);

  useEffect(() => {
    const setupMicrophone = async () => {
      try {
        // Create audio context
        audioCtxRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();

        // Create analyser
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 64;

        // Get microphone stream
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // Connect stream to analyser
        const source = audioCtxRef.current.createMediaStreamSource(
          streamRef.current
        );
        source.connect(analyserRef.current);

        setIsMicReady(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    setupMicrophone();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <>
      {isMicReady && (
        <MicVisualizer icon={<Mic />} analyser={analyserRef.current} />
      )}
    </>
  );
}

export default App;
