import React, { useEffect, useRef } from "react";

const MicVisualizer = ({ icon = null }) => {
  const canvasRef = useRef(null);
  const iconRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 300;
    canvas.height = 300;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      draw();
    });

    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      const volume =
        dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const baseRadius = 40;
      const glowRadius = baseRadius + volume * 0.8;

      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius,
        centerX,
        centerY,
        glowRadius
      );
      gradient.addColorStop(0, `rgba(0, 200, 255, 0.2)`);
      gradient.addColorStop(1, `rgba(0, 255, 180, 0.8)`);

      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Only draw fallback icon if no custom icon provided
      if (!icon) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.fillRect(centerX - 5, centerY - 20, 10, 30);
        ctx.beginPath();
        ctx.arc(centerX, centerY - 20, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(centerX - 10, centerY + 10, 20, 2);
      }
    };
  }, [icon]);

  return (
    <div
      style={{
        position: "relative",
        width: 300,
        height: 300,
        textAlign: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          borderRadius: "50%",
          width: "100%",
          height: "100%",
        }}
      />
      {icon && (
        <div
          ref={iconRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
          }}
        >
          {icon}
        </div>
      )}
    </div>
  );
};

export default MicVisualizer;
