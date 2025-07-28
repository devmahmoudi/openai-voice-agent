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

  const getStream = async () => {
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

      const stream = await getStream();

      return context.createMediaStreamSource(stream);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const getAudioAnalyser = (fftSize = 64) => {
    const context = getAudioContext()

    const analyser = context.createAnalyser()

    analyser.fftSize = fftSize;

    return analyser
  };

  return (
    <AudioContext.Provider
      value={{ getAudioContext, getStream, getAudioSource, getAudioAnalyser }}
    >
      {children}
    </AudioContext.Provider>
  );
};
