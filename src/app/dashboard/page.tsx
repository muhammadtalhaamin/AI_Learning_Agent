'use client';

import { useRef, useState, useEffect } from 'react';
import { Brain, Upload, Trash2, Settings, MessageSquare, Palette, Save, Volume2, Moon, Sun, Languages, User } from 'lucide-react';
import AudioControls from '@/components/AudioControls';
import Link from 'next/link';

interface Message {
  type: 'user' | 'assistant';
  text: string;
  isTyping?: boolean;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Dashboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#FFFF00');
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Typing effect function
  const addMessageWithTypingEffect = (message: Message) => {
    if (message.type === 'assistant') {
      const fullText = message.text;
      let currentIndex = 0;
      
      // Add initial message with empty text
      setMessages(prev => [...prev, { ...message, text: '', isTyping: true }]);

      const typeText = () => {
        if (currentIndex <= fullText.length) {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            lastMessage.text = fullText.slice(0, currentIndex);
            lastMessage.isTyping = currentIndex < fullText.length;
            return newMessages;
          });
          currentIndex++;
          setTimeout(typeText, 30); // Adjust speed as needed
        }
      };

      // Start typing after audio finishes or immediately if no audio
      if (!isPlaying) {
        typeText();
      } else {
        const checkAudioAndType = setInterval(() => {
          if (!isPlaying) {
            clearInterval(checkAudioAndType);
            typeText();
          }
        }, 100);
      }
    } else {
      setMessages(prev => [...prev, message]);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setConversationHistory([]);
  };

  const playAudioResponse = (base64Audio: string) => {
    if (!audioEnabled) return; // Skip if audio is disabled
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      setIsPlaying(true);
      audioRef.current.play();
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const processMediaData = async (audioData?: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const imageData = canvas ? canvas.toDataURL('image/jpeg').split(',')[1] : '';

      const mediaChunks = [];
      if (audioData) {
        mediaChunks.push({
          mime_type: 'audio/webm',
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
        body: JSON.stringify({ 
          media_chunks: mediaChunks,
          conversationHistory
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add user message (transcription) if available
        if (data.transcription) {
          const userMessage: Message = { type: 'user', text: data.transcription };
          addMessageWithTypingEffect(userMessage);
          setConversationHistory(prev => [
            ...prev,
            { role: 'user', content: data.transcription }
          ]);
        }

        // Play audio response first if available
        if (data.audioResponse) {
          playAudioResponse(data.audioResponse);
        }

        // Add assistant message with typing effect
        if (data.text) {
          const assistantMessage: Message = { type: 'assistant', text: data.text };
          addMessageWithTypingEffect(assistantMessage);
          setConversationHistory(prev => [
            ...prev,
            { role: 'assistant', content: data.text }
          ]);
        }
      } else {
        console.error('Processing error:', data.error);
      }
    } catch (error) {
      console.error('Error processing media:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAudioData = async (base64Audio: string) => {
    await processMediaData(base64Audio);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canvasRef.current) {
      // Clear messages and conversation history first
      clearMessages();
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (ctx && canvas) {
            // Keep canvas dimensions fixed
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

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

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'canvas-drawing.png';
      link.href = dataUrl;
      link.click();
    }
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'light');
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="h-16 bg-white shadow-md dark:bg-gray-800">
        <div className="container mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <Link href="/">AI Math Agent</Link>
              </span>
            </div>
            <div className="flex items-center gap-4 relative">
              <button
                onClick={toggleSettings}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Settings Menu */}
              {isSettingsOpen && (
                <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg w-64 z-50">
                  <div className="p-4 space-y-4">
                    {/* Theme Toggle */}
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      {theme === 'light' ? (
                        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      ) : (
                        <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      )}
                      <span className="text-gray-700 dark:text-gray-300">
                        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                      </span>
                    </button>

                    {/* Audio Toggle */}
                    <button
                      onClick={toggleAudio}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {audioEnabled ? 'Disable Audio' : 'Enable Audio'}
                      </span>
                    </button>

                    {/* Language Preferences */}
                    <button
                      onClick={() => alert('Language preferences coming soon!')}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      <Languages className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      <span className="text-gray-700 dark:text-gray-300">Language</span>
                    </button>

                    {/* Clear Data */}
                    <button
                      onClick={clearMessages}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      <span className="text-gray-700 dark:text-gray-300">Clear Chat</span>
                    </button>

                    {/* Account Settings */}
                    <button
                      onClick={() => alert('Account settings coming soon!')}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      <span className="text-gray-700 dark:text-gray-300">Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-6 py-4 overflow-hidden">
        <div className="h-full flex gap-6">
          {/* Left Panel - Drawing Tools and Canvas */}
          <div className="w-[800px] flex flex-col gap-4">
            {/* Tools Panel */}
            <div className="bg-white rounded-xl shadow-sm p-4 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </label>
                  <button
                    onClick={clearCanvas}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition dark:bg-gray-700 dark:text-gray-300"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                  <button
                    onClick={saveCanvas}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition dark:bg-green-800 dark:text-green-200"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg dark:bg-gray-700">
                    <Palette className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    <input
                      type="number"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      min="1"
                      max="20"
                      className="w-16 px-2 py-1 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                      placeholder="Size"
                    />
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="bg-white rounded-xl shadow-sm p-4 flex-1 dark:bg-gray-800">
              <canvas
                ref={canvasRef}
                width={750}
                height={500}
                className="w-[750px] h-[500px] border border-gray-200 rounded-lg cursor-crosshair bg-white dark:border-gray-600"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
              />
            </div>

            {/* Audio Controls */}
            <div className="bg-white rounded-xl shadow-sm p-4 dark:bg-gray-800">
              <AudioControls onAudioData={handleAudioData} />
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden dark:bg-gray-800">
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 dark:text-gray-300">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Conversation
                  {isPlaying && (
                    <Volume2 className="w-5 h-5 text-green-500 animate-pulse" />
                  )}
                </h2>
                <button
                  onClick={clearMessages}
                  className="p-2 hover:bg-gray-100 rounded-lg transition dark:hover:bg-gray-700"
                >
                  <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      message.type === 'assistant'
                        ? 'bg-blue-50 ml-4 dark:bg-blue-900'
                        : 'bg-gray-50 mr-4 dark:bg-gray-700'
                    }`}
                  >
                    <p className="text-gray-700 dark:text-gray-300">
                      {message.text}
                      {message.isTyping && (
                        <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse dark:bg-gray-500" />
                      )}
                    </p>
                  </div>
                ))}
                {isProcessing && !isPlaying && (
                  <div className="flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
                    <div className="animate-pulse">Processing your request...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <audio 
        ref={audioRef} 
        className="hidden"
        onPlay={() => setIsPlaying(true)}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}