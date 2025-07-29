import { useReducer } from "react";
import MicVisualizer from "./MicVisualizer";
import { Mic } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import AudioContext from "../contexts/AudioContext";

const Recorder = () => {
  const audioContext = useContext(AudioContext);

  const [analyser, setAnalyser] = useState(null);

  useEffect(() => {
    const setupAnalyzer = async () => {
      const analyser = await audioContext.getAudioAnalyser();

      const source = await audioContext.getAudioSource();

      if (source) source.connect(analyser);

      setAnalyser(analyser);
    };

    setupAnalyzer();
  }, []);

  const startRecorder = useReducer(
    (state, action) => {
      switch (action) {
        case "start":
          return {
            isRecording: true,
            mediaRecorder: null,
          };
        case "stop":
          return {
            isRecording: false,
            mediaRecorder: null,
          };
        default:
          return state;
      }
    },
    {
      isRecording: false,
      mediaRecorder: null,
    }
  );

  return (
    <MicVisualizer analyser={analyser}>
      <Mic />
    </MicVisualizer>
  );
};

export default Recorder;
