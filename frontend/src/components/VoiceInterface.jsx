import { useState, useEffect, useRef } from "react";
import { Mic, Volume2 } from "lucide-react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents-realtime";
import { getClientSecretKey } from "../service/api";
import MicVisualizer from "./MicVisualizer";

function VoiceInterface() {
  // Audio states
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const sessionRef = useRef(null);

  // Initialize AI session
  useEffect(() => {
    const agent = new RealtimeAgent({
      name: "Voice Assistant",
      instructions: "شما دستیار هوش مصنوعی شرکت ساتیا هستید...",
    });

    const session = new RealtimeSession(agent);
    sessionRef.current = session;

    session.on("audio", (event) => {
      const audioBlob = new Blob([event.audioData], { type: "audio/mp3" });
      setCurrentAudio(audioBlob);
      setIsPlaying(true);
    });

    return () => {
      session.disconnect();
    };
  }, []);

  // Connect to AI service
  const connectToAI = async () => {
    try {
      const response = await getClientSecretKey(
        "gpt-4o-realtime-preview-2025-06-03"
      );
      await sessionRef.current.connect({ apiKey: response.data.value });
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  // Handle recording
  const startRecording = async () => {
    try {
      await connectToAI();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      // Setup audio visualization
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      analyserRef.current = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const arrayBuffer = await event.data.arrayBuffer();
          await sessionRef.current.sendAudio(arrayBuffer);
        }
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
    } catch (error) {
      console.error("Recording error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  // Handle playback
  useEffect(() => {
    if (!currentAudio) return;

    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    analyserRef.current = audioContext.createAnalyser();

    audioRef.current = new Audio(URL.createObjectURL(currentAudio));
    const source = audioContext.createMediaElementSource(audioRef.current);
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContext.destination);

    const handleEnd = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    };

    audioRef.current.addEventListener("ended", handleEnd);
    audioRef.current.play().catch(console.error);

    return () => {
      audioRef.current?.removeEventListener("ended", handleEnd);
      audioRef.current?.pause();
    };
  }, [currentAudio]);

  return (
    <div className="flex gap-4 p-4">
      {/* Player Component (when we have audio) */}
      {currentAudio ? (
        <div className="flex flex-col items-center gap-4">
          <MicVisualizer analyser={analyserRef.current}>
            <button className="w-16 h-16 rounded-full flex items-center justify-center bg-green-500 animate-pulse text-white">
              <Volume2 size={24} />
            </button>
          </MicVisualizer>
          <p className="text-sm text-gray-600">AI is responding...</p>
        </div>
      ) : (
        /* Recorder Component */
        <div className="flex flex-col items-center gap-4">
          <MicVisualizer analyser={analyserRef.current}>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isRecording ? "bg-red-500 animate-pulse" : "bg-blue-500"
              } text-white`}
            >
              <Mic size={24} />
            </button>
          </MicVisualizer>
          <p className="text-sm text-gray-600">
            {isRecording ? "در حال صحبت..." : "برای صحبت کلیک کنید"}
          </p>
        </div>
      )}
    </div>
  );
}

export default VoiceInterface;
