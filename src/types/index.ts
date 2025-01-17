// 1. src/types/index.ts
export interface Message {
    type: 'text' | 'audio';
    content: string;
    sender: 'user' | 'assistant';
  }
  
  export interface AudioState {
    isRecording: boolean;
    audioContext: AudioContext | null;
    mediaRecorder: MediaRecorder | null;
  }