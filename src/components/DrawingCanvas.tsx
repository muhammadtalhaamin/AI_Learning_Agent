// 2. src/components/DrawingCanvas.tsx
'use client';

import { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  onImageCapture: (imageData: string) => void;
}

export default function DrawingCanvas({ onImageCapture }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        setContext(ctx);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }

    // Set up image capture interval
    const interval = setInterval(() => {
      if (canvas) {
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onImageCapture(imageData.split(',')[1]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [onImageCapture]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setIsDrawing(true);
      setLastPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.beginPath();
    context.moveTo(lastPos.x, lastPos.y);
    context.lineTo(x, y);
    context.stroke();

    setLastPos({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="border border-gray-300 rounded-lg cursor-crosshair"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
    />
  );
}