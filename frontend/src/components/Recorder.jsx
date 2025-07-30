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
  const audioChunksRef = useRef([]);

  // Moved cleanup to component scope
  const cleanup = useCallback(() => {
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      recorder.stream?.getTracks()?.forEach((track) => track.stop());
    }
    audioChunksRef.current = [];
  }, [recorder]);

  const startRecording = useCallback(async () => {
    try {
      cleanup(); // Clean any previous recording
      audioChunksRef.current = [];
      const stream = await audioContext.getAudioStream();
      const newRecorder = new MediaRecorder(stream);

      newRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
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

      if (recorder.state !== "inactive") {
        recorder.stop();
      }

      // Cleanup the onstop handler after use
      return () => {
        recorder.onstop = null;
      };
    });
  }, [recorder, cleanup]);

  // RECORDING STATE
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

  // CONNECT AUDIO SOURCE TO ANALYSER
  const connectSourceToAnalyser = useCallback(async () => {
    if (!analyser) return;
    try {
      const voiceSource = await audioContext.getAudioSource();
      voiceSource.connect(analyser);
    } catch (error) {
      console.error("Error connecting source to analyser:", error);
    }
  }, [analyser, audioContext]);

  // DISCONNECT AUDIO SOURCE FROM ANALYSER
  const disconnectSourceToAnalyser = useCallback(async () => {
    if (!analyser) return;
    try {
      const voiceSource = await audioContext.getAudioSource();
      voiceSource.disconnect(analyser);
    } catch (error) {
      console.error("Error disconnecting source from analyser:", error);
    }
  }, [analyser, audioContext]);

  // TOGGLE AUDIO CONNECTION BASED ON RECORDING STATE
  useEffect(() => {
    if (state.isRecording) {
      connectSourceToAnalyser();
    } else {
      disconnectSourceToAnalyser();
    }
  }, [state.isRecording, connectSourceToAnalyser, disconnectSourceToAnalyser]);

  // INITIALIZE ANALYSER
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

  // CLEANUP ON UNMOUNT
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <div className="recorder-container">
      <MicVisualizer analyser={analyser}>
        <Mic
          className={`cursor-pointer p-3 box-content rounded-full ${
            state.isRecording ? "bg-red-500 animate-pulse" : "bg-gray-500"
          }`}
          onClick={() => dispatch(state.isRecording ? "stop" : "start")}
        />
      </MicVisualizer>
      <div className="text-sm mt-2 text-center">
        {state.isRecording ? "Recording..." : "Click to record"}
      </div>
    </div>
  );
};

export default Recorder;
