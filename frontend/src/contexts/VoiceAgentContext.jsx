import { createContext, useContext, useEffect, useState } from 'react';
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';

const VoiceAgentContext = createContext();

export function VoiceAgentProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Initialize session and agent
  useEffect(() => {
    const agent = new RealtimeAgent({
      name: 'Assistant',
      instructions: 'You are a helpful assistant.',
    });

    const newSession = new RealtimeSession(agent);
    setSession(newSession);

    return () => {
      newSession.disconnect(); // Cleanup
    };
  }, []);

  // Connect to OpenAI
  const connect = async (apiKey) => {
    try {
      await session.connect({ apiKey });
      setIsConnected(true);
    } catch (err) {
      setError(err);
    }
  };

  const value = {
    session,
    isConnected,
    error,
    connect,
    disconnect: () => {
      session?.disconnect();
      setIsConnected(false);
    },
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useVoiceAgent = () => {
  const context = useContext(VoiceAgentContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};