import { RealtimeAgent, RealtimeSession } from "@openai/agents-realtime";
import { createContext, useContext, useEffect, useState } from "react";

const VoiceAgentContext = createContext();

export function VoiceAgentProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [audioQueue, setAudioQueue] = useState([]);

  // Initialize session and agent
  useEffect(() => {
    const agent = new RealtimeAgent({
      name: "Voice Assistant",
      instructions:
        "You are a helpful voice assistant. Respond conversationally.",
    });

    const newSession = new RealtimeSession(agent);

    // Set up audio event listener
    newSession.on("audio", (event) => {
      setIsAgentSpeaking(true);
      setAudioQueue((prev) => [...prev, event.audioData]);
    });

    newSession.on("end", () => {
      setIsAgentSpeaking(false);
    });

    setSession(newSession);

    return () => {
      if (newSession && newSession.disconnect) {
        newSession.disconnect();
      }
    };
  }, []);

  const connect = async (apiKey) => {
    try {
      if (!session) throw new Error("Session not initialized");
      await session.connect({ apiKey });
      setIsConnected(true);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const value = {
    session,
    isConnected,
    error,
    isAgentSpeaking,
    audioQueue,
    connect,
    clearAudioQueue: () => setAudioQueue([]),
    setIsAgentSpeaking,
    disconnect: () => {
      session?.disconnect();
      setIsConnected(false);
    },
  };

  return (
    <VoiceAgentContext.Provider value={value}>
      {children}
    </VoiceAgentContext.Provider>
  );
}

export const useVoiceAgent = () => {
  const context = useContext(VoiceAgentContext);
  if (!context) {
    throw new Error("useVoiceAgent must be used within a VoiceAgentProvider");
  }
  return context;
};
