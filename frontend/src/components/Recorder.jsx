import { useReducer, useRef } from "react";
import MicVisualizer from "./MicVisualizer";
import { Mic } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import AudioContext from "../contexts/AudioContext";

const Recorder = () => {
  const audioContext = useContext(AudioContext);

  const [analyser, setAnalyser] = useState(null);

  const [recorder, setRecorder] = useState(null);

  const socketRef = useRef();

  const startRecording = async () => {
    // Open WebSocket connection
    socketRef.current = new WebSocket(
      "ws://localhost:8000/ws/voice-stream-to-file"
    );

    const recorder = new MediaRecorder(await audioContext.getAudioStream());

    // Wait for WebSocket to open before starting recording
    socketRef.current.onopen = () => {
      recorder.start(250);
      setRecorder(recorder);
    };

    // Optional: handle WebSocket errors
    socketRef.current.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return recorder;
  };

  const stopRecording = () => {
    if (!recorder) return;

    recorder.ondataavailable = null;

    if (recorder.state !== "inactive") {
      recorder.stop();
    }

    // Close WebSocket connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setRecorder(null);
  };

  // RECORDING STATE
  const [state, dispatch] = useReducer(
    (state, action) => {
      switch (action) {
        case "start":
          startRecording();

          return {
            isRecording: true,
          };
        case "stop":
          stopRecording();

          return {
            isRecording: false,
          };
        default:
          return state;
      }
    },
    {
      isRecording: false,
    }
  );

  // HANDLE RECORDER DATA
  useEffect(() => {
    if (recorder && state.isRecording) {
      recorder.ondataavailable = (e) => {
        if (
          e.data &&
          e.data.size > 0 &&
          socketRef.current &&
          socketRef.current.readyState === WebSocket.OPEN
        ) {
          socketRef.current.send(e.data);
        }
      };
    }
  }, [recorder, state.isRecording]);

  // CONNECTION SWITCHER BETWEEN SOURCE AND ANALYSER
  useEffect(() => {
    if (state.isRecording) {
      connectSourceToAnalyser();
    } else {
      disconnectSourceToAnalyser();
    }
  }, [state.isRecording]);

  // CONNECT AUDIO SOURCE TO ANALYSER
  const connectSourceToAnalyser = async () => {
    const voiceSource = await audioContext.getAudioSource();

    voiceSource.connect(analyser);
  };

  // DISCONNECT AUDIO SOURCE FROM ANALYSER
  const disconnectSourceToAnalyser = async () => {
    const voiceSource = await audioContext.getAudioSource();

    setAnalyser(audioContext.getAudioAnalyser());
  };

  /* 
    SET INIT VALUES FOR: 
      1.ANALYSER
      2.SOCKET
  */
  useEffect(() => {
    const setupAnalyzer = async () => {
      setAnalyser(await audioContext.getAudioAnalyser());
    };

    setupAnalyzer();
  }, []);

  return (
    <MicVisualizer analyser={analyser}>
      <Mic
        className="cursor-pointer bg-red-500 p-3 box-content rounded-full"
        onClick={() => {
          dispatch(state.isRecording ? "stop" : "start");
        }}
      />
    </MicVisualizer>
  );
};

export default Recorder;
