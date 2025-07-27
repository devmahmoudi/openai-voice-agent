import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
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
