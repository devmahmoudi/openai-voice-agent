import { useReducer } from "react";
import MicVisualizer from "./MicVisualizer";
import { Mic } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import AudioContext from "../contexts/AudioContext";

const Recorder = () => {
  const audioContext = useContext(AudioContext);

  const [analyser, setAnalyser] = useState(null);

  const [recorder, setRecorder] = useState(null);

  const startRecording = async () => {
    const recorder = new MediaRecorder(await audioContext.getAudioStream());

    recorder.start(250);

    setRecorder(recorder);

    return recorder;
  };

  const stopRecording = () => {
    if (!recorder) return;

    recorder.ondataavailable = null;

    if (recorder.state !== "inactive") {
      recorder.stop();
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
        console.log(e.data);
      };
    }
  }, [recorder]);

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

  // SET INIT VALUE FOR ANALYSER IN THE COMPONENT MOUNT
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
