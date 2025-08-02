import { useCallback, useEffect, useRef, useState } from "react";
import MicVisualizer from "./MicVisualizer";
import { Mic } from "lucide-react";
import { getClientSecretKey } from "../service/api";
import { useVoiceAgent } from "../contexts/VoiceAgentContext";
import Player from "./Player";

const Recorder = ({ onRecordingStart, onRecordingStop }) => {
  const { session, isConnected, connect } = useVoiceAgent();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [analyser, setAnalyser] = useState(null);

  const initializeAgent = useCallback(async () => {
    try {
      const response = await getClientSecretKey(
        "gpt-4o-realtime-preview-2025-06-03"
      );
      await connect(response.data.value);
    } catch (error) {
      console.error("Failed to initialize agent:", error);
    }
  }, [connect]);

  const startRecording = useCallback(async () => {
    try {
      if (!isConnected) await initializeAgent();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      setAnalyser(analyser);

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          try {
            const arrayBuffer = await event.data.arrayBuffer();
            await session.sendAudio(arrayBuffer);
          } catch (error) {
            console.error("Error sending audio:", error);
          }
        }
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      onRecordingStart?.();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, [isConnected, initializeAgent, session, onRecordingStart]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
      onRecordingStop?.();
    }
  }, [isRecording, onRecordingStop]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return (
    <div className="flex flex-col items-center gap-4">
      <MicVisualizer analyser={analyser}>
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
        {isRecording ? "Speak now..." : "Tap to speak"}
      </p>
    </div>
  );
};

export default Recorder;
