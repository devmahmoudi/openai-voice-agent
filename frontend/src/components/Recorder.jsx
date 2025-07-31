import {
  useReducer,
  useRef,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import MicVisualizer from "./MicVisualizer";
import { Mic } from "lucide-react";
import AudioContext from "../contexts/AudioContext";
import { initialState, reducer } from "../utils/recording";

const Recorder = ({ onRecordingComplete }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [analyser, setAnalyser] = useState(null);
  const audioContext = useContext(AudioContext);

  const recorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const socketRef = useRef(null);
  const voiceSourceRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);

  const socketUrl = useMemo(
    () => "ws://127.0.0.1:8000/ws/voice-stream-to-file",
    []
  );

  const cleanup = useCallback(() => {
    if (recorderRef.current?.state !== "inactive") {
      recorderRef.current?.stop();
      recorderRef.current = null;
    }

    mediaStreamRef.current?.getTracks()?.forEach((track) => track.stop());
    mediaStreamRef.current = null;

    audioChunksRef.current = [];
    audioBufferRef.current = null;

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
    socketRef.current = null;
  }, []);

  const initWebSocket = useCallback(() => {
    try {
      dispatch({ type: "SET_SOCKET_STATUS", payload: "connecting" });
      socketRef.current = new WebSocket(socketUrl);

      socketRef.current.onopen = () => {
        console.log("WebSocket connection established");
        dispatch({ type: "SET_SOCKET_STATUS", payload: "connected" });
      };

      socketRef.current.onclose = () => {
        console.log("WebSocket connection closed");
        dispatch({ type: "SET_SOCKET_STATUS", payload: "disconnected" });
      };

      socketRef.current.onerror = () => {
        console.error("WebSocket connection error");
        dispatch({ type: "SET_SOCKET_STATUS", payload: "error" });
      };
    } catch (error) {
      console.error("WebSocket initialization error:", error);
      dispatch({ type: "SET_SOCKET_STATUS", payload: "error" });
    }
  }, [socketUrl]);

  const convertToPCM16Wav = useCallback(async (blob) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(
        arrayBuffer
      );
      audioBufferRef.current = audioBuffer;
      const pcmData = audioBuffer.getChannelData(0);
      const pcm16 = new Int16Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        pcm16[i] = Math.max(-32768, Math.min(32767, pcmData[i] * 32768));
      }
      const wavHeader = createWavHeader({
        sampleRate: audioBuffer.sampleRate,
        length: pcm16.length,
        numChannels: audioBuffer.numberOfChannels,
        bitDepth: 16,
      });
      const wavData = new Uint8Array(wavHeader.length + pcm16.length * 2);
      wavData.set(wavHeader, 0);
      wavData.set(new Uint8Array(pcm16.buffer), wavHeader.length);

      return new Blob([wavData], { type: "audio/wav" });
    } catch (error) {
      console.error("Error converting to PCM16 WAV:", error);
      throw error;
    }
  }, []);

  const createWavHeader = useCallback((options) => {
    const { sampleRate, length, numChannels, bitDepth } = options;
    const byteRate = (sampleRate * numChannels * bitDepth) / 8;
    const blockAlign = (numChannels * bitDepth) / 8;
    const dataSize = (length * numChannels * bitDepth) / 8;

    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

    return new Uint8Array(buffer);
  }, []);

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const startRecording = useCallback(async () => {
    try {
      cleanup();
      audioChunksRef.current = [];

      const stream = await audioContext.getAudioStream();
      mediaStreamRef.current = stream;

      const options = { mimeType: "audio/webm;codecs=pcm" };
      const recorder = new MediaRecorder(
        stream,
        MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined
      );
      recorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
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

      recorder.start(250);
      dispatch({ type: "START_RECORDING" });
    } catch (error) {
      console.error("Error starting recording:", error);
      throw error;
    }
  }, [audioContext, cleanup]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return null;

    return new Promise((resolve) => {
      const onStop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current);
          const pcm16Blob = await convertToPCM16Wav(audioBlob);
          cleanup();
          resolve(pcm16Blob);
        } catch (error) {
          console.error("Error processing audio:", error);
          cleanup();
          resolve(null);
        }
      };

      recorderRef.current.onstop = onStop;
      recorderRef.current.stop();
      dispatch({ type: "STOP_RECORDING" });
    });
  }, [cleanup, convertToPCM16Wav]);

  const toggleRecording = useCallback(async () => {
    if (state.isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        onRecordingComplete(audioBlob);
      }
    } else {
      await startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording, onRecordingComplete]);

  const handleAnalyserConnection = useCallback(
    async (shouldConnect) => {
      if (!analyser) return;

      try {
        if (shouldConnect) {
          voiceSourceRef.current = await audioContext.getAudioSource();
          voiceSourceRef.current.connect(analyser);
        } else if (voiceSourceRef.current) {
          voiceSourceRef.current.disconnect(analyser);
        }
      } catch (error) {
        console.error("Error handling analyser connection:", error);
      }
    },
    [analyser, audioContext]
  );

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

  useEffect(() => {
    handleAnalyserConnection(state.isRecording);

    return () => {
      if (state.isRecording) {
        handleAnalyserConnection(false);
      }
    };
  }, [state.isRecording, handleAnalyserConnection]);

  useEffect(() => {
    initWebSocket();
    return cleanup;
  }, [initWebSocket, cleanup]);

  const socketStatusMessage = useMemo(() => {
    switch (state.socketStatus) {
      case "connected":
        return "Connected to server";
      default:
        return `Status: ${state.socketStatus}`;
    }
  }, [state.socketStatus]);

  return (
    <div className="recorder-container flex flex-col items-center">
      <MicVisualizer analyser={analyser}>
        <Mic
          className={`cursor-pointer p-3 box-content rounded-full ${
            state.isRecording
              ? "bg-red-500 animate-pulse"
              : "bg-gray-500 hover:bg-gray-400"
          } transition-colors`}
          onClick={toggleRecording}
          size={24}
        />
      </MicVisualizer>

      <div className="text-sm mt-2 text-center">
        {state.isRecording ? "Recording..." : "Click to record"}
      </div>

      <div
        className={`text-xs mt-1 text-center ${
          state.socketStatus === "connected" ? "text-green-500" : "text-red-500"
        }`}
      >
        {socketStatusMessage}
      </div>
    </div>
  );
};

export default Recorder;
