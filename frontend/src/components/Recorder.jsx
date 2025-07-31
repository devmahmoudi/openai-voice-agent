import {
  useReducer,
  useRef,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import MicVisualizer from "./MicVisualizer";
import { Mic } from "lucide-react";
import AudioContext from "../contexts/AudioContext";

const Recorder = ({ onRecordingComplete }) => {
  const audioContext = useContext(AudioContext);
  const [analyser, setAnalyser] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const audioChunksRef = useRef([]);
  const socketRef = useRef(null);
  const voiceSourceRef = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop recording if active
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      recorder.stream?.getTracks()?.forEach((track) => track.stop());
    }
    audioChunksRef.current = [];

    // Close WebSocket connection if exists
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }
  }, [recorder]);

  // Initialize WebSocket connection
  useEffect(() => {
    const initWebSocket = () => {
      try {
        const socketUrl = "ws://127.0.0.1:8000/ws/voice-stream-to-file";
        socketRef.current = new WebSocket(socketUrl);
        setSocketStatus("connecting");

        socketRef.current.onopen = () => {
          console.log("WebSocket connection established");
          setSocketStatus("connected");
        };

        socketRef.current.onclose = () => {
          console.log("WebSocket connection closed");
          setSocketStatus("disconnected");
        };

        socketRef.current.onerror = () => {
          console.error("WebSocket connection error");
          setSocketStatus("error");
        };
      } catch (error) {
        console.error("WebSocket initialization error:", error);
        setSocketStatus("error");
      }
    };

    initWebSocket();

    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      cleanup();
      audioChunksRef.current = [];

      const stream = await audioContext.getAudioStream();
      const newRecorder = new MediaRecorder(stream);

      newRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);

          if (socketRef.current?.readyState === WebSocket.OPEN) {
            try {
              const buffer = await e.data.arrayBuffer();
              socketRef.current.send(buffer);
            } catch (sendError) {
              console.error("Error sending audio data:", sendError);
            }
          }
        }
      };

      newRecorder.start(250);
      setRecorder(newRecorder);
      return newRecorder;
    } catch (error) {
      console.error("Error starting recording:", error);
      throw error;
    }
  }, [audioContext, cleanup]);

  const stopRecording = useCallback(async () => {
    if (!recorder) return null;

    return new Promise((resolve) => {
      const onStop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        cleanup();
        resolve(audioBlob);
      };

      recorder.onstop = onStop;
      recorder.stop();
    });
  }, [recorder, cleanup]);

  // Recording state reducer
  const [state, dispatch] = useReducer(
    (state, action) => {
      switch (action) {
        case "start":
          startRecording();
          return { isRecording: true };
        case "stop":
          stopRecording().then((audioBlob) => {
            if (audioBlob) {
              onRecordingComplete(audioBlob);
            }
          });
          return { isRecording: false };
        default:
          return state;
      }
    },
    { isRecording: false }
  );

  // Audio analyzer setup
  const connectSourceToAnalyser = useCallback(async () => {
    if (!analyser) return;
    try {
      voiceSourceRef.current = await audioContext.getAudioSource();
      voiceSourceRef.current.connect(analyser);
    } catch (error) {
      console.error("Error connecting source to analyser:", error);
    }
  }, [analyser, audioContext]);

  const disconnectSourceToAnalyser = useCallback(async () => {
    if (!analyser || !voiceSourceRef.current) return;
    try {
      if (voiceSourceRef.current && analyser) {
        voiceSourceRef.current.disconnect(analyser);
      }
    } catch (error) {
      console.error("Error disconnecting source from analyser:", error);
    }
  }, [analyser]);

  // Toggle audio connection based on recording state
  useEffect(() => {
    if (state.isRecording) {
      connectSourceToAnalyser();
    } else {
      disconnectSourceToAnalyser();
    }
  }, [state.isRecording, connectSourceToAnalyser, disconnectSourceToAnalyser]);

  // Initialize audio analyzer
  useEffect(() => {
    const setupAnalyzer = async () => {
      try {
        setAnalyser(await audioContext.getAudioAnalyser());
      } catch (error) {
        console.error("Error setting up analyser:", error);
      }
    };

    setupAnalyzer();
  }, [audioContext]);

  return (
    <div className="recorder-container flex flex-col items-center">
      <MicVisualizer analyser={analyser}>
        <Mic
          className={`cursor-pointer p-3 box-content rounded-full ${
            state.isRecording
              ? "bg-red-500 animate-pulse"
              : "bg-gray-500 hover:bg-gray-400"
          } transition-colors`}
          onClick={() => dispatch(state.isRecording ? "stop" : "start")}
          size={24}
        />
      </MicVisualizer>

      <div className="text-sm mt-2 text-center">
        {state.isRecording ? "Recording..." : "Click to record"}
      </div>

      <div
        className={`text-xs mt-1 text-center ${
          socketStatus === "connected" ? "text-green-500" : "text-red-500"
        }`}
      >
        {socketStatus === "connected"
          ? "Connected to server"
          : `Status: ${socketStatus}`}
      </div>
    </div>
  );
};

export default Recorder;
