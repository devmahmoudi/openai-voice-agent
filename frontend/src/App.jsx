import "./App.css";
import MicVisualizer from "./components/MicVisualizer";
import { Mic } from "lucide-react";

function App() {
  return (
    <>
      <MicVisualizer icon={<Mic />} />
    </>
  );
}

export default App;
