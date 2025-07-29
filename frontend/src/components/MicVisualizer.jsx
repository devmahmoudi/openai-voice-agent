import React, { useEffect, useRef } from "react";

const MicVisualizer = ({ children, analyser }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 300;
    canvas.height = 300;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

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
    };

    draw();
  }, [analyser]);

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
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default MicVisualizer;
