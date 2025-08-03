import { useState, useEffect, useRef } from "react";
import { Mic, Volume2 } from "lucide-react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents-realtime";
import { getClientSecretKey } from "../service/api";
import MicVisualizer from "./MicVisualizer";

function VoiceInterface() {
  // State management
  const [mode, setMode] = useState("ready"); // 'ready', 'recording', 'playing'
  const [audioBlob, setAudioBlob] = useState(null);

  // Refs for audio elements
  const mediaRecorderRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const analyserRef = useRef(null);
  const sessionRef = useRef(null);

  // Initialize AI session once
  useEffect(() => {
    const initializeAgent = async () => {
      const agent = new RealtimeAgent({
        name: "ساتیا",
        instructions: "شما دستیار هوشمند شرکت ساتیا هستید...",
      });

      const session = new RealtimeSession(agent);
      sessionRef.current = session;

      session.on("audio", async (event) => {
        const blob = new Blob([event.audioData], { type: "audio/mp3" });
        setAudioBlob(blob);
        setMode("playing");
      });

      // Connect to service
      try {
        const response = await getClientSecretKey(
          "gpt-4o-realtime-preview-2025-06-03"
        );
        await session.connect({ apiKey: response.data.value });
      } catch (error) {
        console.error("Connection error:", error);
      }
    };

    initializeAgent();

    return () => {
      if (sessionRef.current) {
        sessionRef.current.disconnect();
      }
    };
  }, []);

  // Handle recording start/stop
  const toggleRecording = async () => {
    if (mode === "recording") {
      // Stop recording
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setMode("processing");
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // Setup audio visualization
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        analyserRef.current = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });

        mediaRecorderRef.current.ondataavailable = async (event) => {
          if (event.data.size > 0) {
            const arrayBuffer = await event.data.arrayBuffer();
            await sessionRef.current.sendAudio(arrayBuffer);
          }
        };

        mediaRecorderRef.current.start(100);
        setMode("recording");
      } catch (error) {
        console.error("Recording error:", error);
        setMode("ready");
      }
    }
  };

  // Handle audio playback
  useEffect(() => {
    if (mode !== "playing" || !audioBlob) return;

    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    analyserRef.current = audioContext.createAnalyser();

    audioPlayerRef.current = new Audio(URL.createObjectURL(audioBlob));
    const source = audioContext.createMediaElementSource(
      audioPlayerRef.current
    );
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContext.destination);

    const handleEnd = () => {
      setMode("ready");
      setAudioBlob(null);
    };

    audioPlayerRef.current.addEventListener("ended", handleEnd);
    audioPlayerRef.current.play().catch(console.error);

    return () => {
      audioPlayerRef.current?.removeEventListener("ended", handleEnd);
      audioPlayerRef.current?.pause();
    };
  }, [mode, audioBlob]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <MicVisualizer analyser={analyserRef.current}>
        {mode === "playing" ? (
          <button className="w-16 h-16 rounded-full bg-green-500 animate-pulse flex items-center justify-center text-white">
            <Volume2 size={24} />
          </button>
        ) : (
          <button
            onClick={toggleRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              mode === "recording" ? "bg-red-500 animate-pulse" : "bg-blue-500"
            } text-white`}
          >
            <Mic size={24} />
          </button>
        )}
      </MicVisualizer>

      <p className="text-sm text-gray-600">
        {mode === "ready" && "برای صحبت کلیک کنید"}
        {mode === "recording" && "در حال ضبط صدا..."}
        {mode === "processing" && "در حال پردازش..."}
        {mode === "playing" && "در حال پخش پاسخ..."}
      </p>
    </div>
  );
}

export default VoiceInterface;
