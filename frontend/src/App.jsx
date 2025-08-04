import "./App.css";
import VoiceInterface from "./components/VoiceInterface";
import { VoiceAgentProvider } from "./contexts/VoiceAgentContext";
function App() {
  return (
    <VoiceAgentProvider>
      <VoiceInterface />
    </VoiceAgentProvider>
  );
}

export default App;
