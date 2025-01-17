export interface AudioState {
    isRecording: boolean;
    audioContext: AudioContext | null;
    mediaRecorder: MediaRecorder | null;
  }