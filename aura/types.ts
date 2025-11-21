export enum AppState {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  ADMIN = 'ADMIN',
}

export enum VoiceState {
  LISTENING = 'LISTENING', // User is speaking / waiting for input
  THINKING = 'THINKING',   // Processing (Gemini API)
  SPEAKING = 'SPEAKING',   // TTS playback
  ERROR = 'ERROR',         // Permission denied or Network down
}

export interface Poster {
  id: number;
  imageUrl: string;
  title: string;
  subtitle: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}