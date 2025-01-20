'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AudioState } from '@/types';

interface AudioControlsProps {
  onAudioData: (data: string) => void;
}

export default function AudioControls({ onAudioData }: AudioControlsProps) {
  const [audioState, setAudioState] = useState<AudioState>({
    isRecording: false,
    audioContext: null,
    mediaRecorder: null
  });

  const [chunks, setChunks] = useState<Blob[]>([]);

  // Convert blob to base64
  const blobToBase64 = async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Extract the base64 data from the data URL
          const base64Data = reader.result.split(',')[1];
          resolve(base64Data);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const audioContext = new AudioContext({ sampleRate: 16000 });
      
      // Try to use webm format first, fall back to other supported formats
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg')
        ? 'audio/ogg'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      setChunks([]); // Clear existing chunks

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          setChunks(prevChunks => [...prevChunks, event.data]);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: mimeType });
        try {
          const base64Audio = await blobToBase64(audioBlob);
          onAudioData(base64Audio);
        } catch (error) {
          console.error('Error converting audio to base64:', error);
        }
        
        stream.getTracks().forEach(track => track.stop());
        setChunks([]); // Clear chunks after processing
      };

      // Collect data in smaller chunks for better memory management
      mediaRecorder.start(1000); // Collect in 1-second chunks

      setAudioState({
        isRecording: true,
        audioContext,
        mediaRecorder
      });
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [chunks, onAudioData]);

  const stopRecording = useCallback(() => {
    try {
      if (audioState.mediaRecorder && audioState.mediaRecorder.state === 'recording') {
        audioState.mediaRecorder.stop();
      }
      if (audioState.audioContext && audioState.audioContext.state !== 'closed') {
        audioState.audioContext.close();
      }
      setAudioState({
        isRecording: false,
        audioContext: null,
        mediaRecorder: null
      });
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }, [audioState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioState.mediaRecorder && audioState.mediaRecorder.state === 'recording') {
        audioState.mediaRecorder.stop();
      }
      if (audioState.audioContext && audioState.audioContext.state !== 'closed') {
        audioState.audioContext.close();
      }
    };
  }, [audioState]);

  return (
    <div className="flex justify-center gap-4 my-4">
      <button
        onClick={startRecording}
        disabled={audioState.isRecording}
        className={`px-4 py-2 rounded-full ${
          audioState.isRecording
            ? 'bg-gray-400'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
      >
        Start Speaking
      </button>
      <button
        onClick={stopRecording}
        disabled={!audioState.isRecording}
        className={`px-4 py-2 rounded-full ${
          !audioState.isRecording
            ? 'bg-gray-400'
            : 'bg-red-500 hover:bg-red-600'
        } text-white`}
      >
        Stop Speaking
      </button>
    </div>
  );
}