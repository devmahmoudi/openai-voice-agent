import { createContext, useRef } from "react";

const AudioContext = createContext();

export default AudioContext;

export const AudioProvider = ({ children }) => {
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);

  const getAudioContext = () => {
    // Create audio context
    if (!audioCtxRef.current)
      audioCtxRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();

    return audioCtxRef.current;
  };

  const getAudioStream = async () => {
    // Get microphone stream
    if (!streamRef.current)
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

    return streamRef.current;
  };

  const getAudioSource = async () => {
    try {
      const context = getAudioContext();

      const stream = await getAudioStream();

      return context.createMediaStreamSource(stream);
    } catch (error) {
      console.error("Error accessing microphone:", error);

      return null;
    }
  };

  const getAudioAnalyser = (fftSize = 64) => {
    const context = getAudioContext();

    const analyser = context.createAnalyser();

    analyser.fftSize = fftSize;

    return analyser;
  };

  return (
    <AudioContext.Provider
      value={{
        getAudioContext,
        getAudioStream,
        getAudioSource,
        getAudioAnalyser,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
