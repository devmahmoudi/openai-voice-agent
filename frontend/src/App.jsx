import "./App.css";
import MicVisualizer from "./components/MicVisualizer";
import { Mic } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import AudioContext from "./contexts/AudioContext";

function App() {
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

  return (
    <>{analyser && <MicVisualizer icon={<Mic />} analyser={analyser} />}</>
  );
}

export default App;
