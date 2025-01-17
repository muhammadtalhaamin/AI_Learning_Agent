// src/app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import AudioControls from '@/components/AudioControls';

interface Message {
  type: 'user' | 'assistant';
  text: string;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#FFFF00');
  const [isProcessing, setIsProcessing] = useState(false);

  // Function to process media data
  const processMediaData = async (audioData?: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const imageData = canvas ? canvas.toDataURL('image/jpeg').split(',')[1] : '';

      const mediaChunks = [];
      if (audioData) {
        mediaChunks.push({
          mime_type: 'audio/pcm',
          data: audioData
        });
      }
      if (imageData) {
        mediaChunks.push({
          mime_type: 'image/jpeg',
          data: imageData
        });
      }

      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ media_chunks: mediaChunks }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.transcription) {
          setMessages(prev => [...prev, { type: 'user', text: data.transcription }]);
        }
        setMessages(prev => [...prev, { type: 'assistant', text: data.text }]);
      } else {
        console.error('Processing error:', data.error);
      }
    } catch (error) {
      console.error('Error processing media:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle audio data from AudioControls
  const handleAudioData = async (base64Audio: string) => {
    await processMediaData(base64Audio);
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    setIsDrawing(true);
    setLastPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.stroke();

    setLastPos({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canvasRef.current) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (ctx && canvas) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4 mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="imageUpload"
          />
          <label
            htmlFor="imageUpload"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
          >
            Upload Image
          </label>
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear
          </button>
          <input
            type="number"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            min="1"
            max="20"
            className="w-20 px-2 border rounded"
          />
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-12 h-8"
          />
        </div>

        <div className="flex gap-8">
          <div className="flex flex-col gap-4">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="border border-gray-300 cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
            />
            <AudioControls onAudioData={handleAudioData} />
          </div>

          <div className="w-[400px] h-[600px] overflow-y-auto border border-gray-300 rounded p-4 bg-gray-50">
            {messages.map((message, index) => (
              <p
                key={index}
                className={`mb-2 p-3 rounded ${
                  message.type === 'assistant' ? 'bg-blue-100' : 'bg-white'
                }`}
              >
                {message.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}