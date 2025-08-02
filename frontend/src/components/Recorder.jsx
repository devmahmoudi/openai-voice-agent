import { useState, useRef, useEffect, useCallback } from "react";
import { useVoiceAgent } from "../contexts/VoiceAgentContext";
import MicVisualizer from "./MicVisualizer";
import { Mic } from "lucide-react";
import { getClientSecretKey } from "../service/api";

const Recorder = ({ onRecordingComplete }) => {
  const { session, isConnected, connect } = useVoiceAgent();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [analyser, setAnalyser] = useState(null);

  const initializeAgent = useCallback(async () => {
    try {
      const response = await getClientSecretKey(
        "gpt-4o-realtime-preview-2025-06-03"
      );
      if (response) {
        await connect(response.data.key);
        console.log(response, "response ..........");
      }
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

      // Setup audio analysis for visualization
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      setAnalyser(analyser);

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const arrayBuffer = await event.data.arrayBuffer();
          if (isConnected) {
            try {
              await session.sendAudio(arrayBuffer);
            } catch (error) {
              console.error("Error sending audio:", error);
            }
          }
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        onRecordingComplete(audioBlob);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start(100); // Send chunks every 100ms
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, [isConnected, initializeAgent, session, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <div className="flex flex-col items-center gap-4">
      <MicVisualizer analyser={analyser}>
        <button
          onClick={toggleRecording}
          className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isRecording ? "bg-red-500 animate-pulse" : "bg-blue-500"
          } text-white`}
        >
          <Mic size={24} />
        </button>
      </MicVisualizer>
      <p className="text-sm text-gray-600">
        {isRecording ? "Recording..." : "Tap to speak"}
      </p>
      {!isConnected && (
        <p className="text-xs text-yellow-600">Connecting to agent...</p>
      )}
    </div>
  );
};

export default Recorder;
