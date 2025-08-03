import React, { useEffect, useRef } from "react";

const MicVisualizer = ({ children, analyser }) => {
  const canvasRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas size dynamically based on container size
    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const centerX = () => canvas.width / 2;
    const centerY = () => canvas.height / 2;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Calculate volume with smoothing (simple moving average)
      const volume =
        dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const baseRadius = Math.min(canvas.width, canvas.height) / 8;
      // Multiple glow circles for smoother effect
      const glowCount = 5;

      for (let i = glowCount; i > 0; i--) {
        const radius = baseRadius + volume * 0.9 * i;
        const opacity = 0.1 * (glowCount - i + 1);

        const gradient = ctx.createRadialGradient(
          centerX(),
          centerY(),
          radius * 0.6,
          centerX(),
          centerY(),
          radius
        );
        gradient.addColorStop(0, `rgba(0, 200, 255, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(0, 255, 180, ${opacity * 0.6})`);
        gradient.addColorStop(1, `rgba(0, 150, 200, 0)`);

        ctx.beginPath();
        ctx.arc(centerX(), centerY(), radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Inner solid circle for core glow
      ctx.beginPath();
      ctx.arc(centerX(), centerY(), baseRadius * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 230, 255, 0.8)";
      ctx.shadowColor = "rgba(0, 230, 255, 0.9)";
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    };
  }, [analyser]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 320,
        aspectRatio: "1 / 1",
        textAlign: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          borderRadius: "50%",
          width: "100%",
          height: "100%",
          display: "block",
          backgroundColor: "rgba(0, 0, 0, 0.05)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2,
          userSelect: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default MicVisualizer;
