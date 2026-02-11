
export enum Tempo {
  Slow = 'ধীর (Slow)',
  Medium = 'মাঝারি (Medium)',
  Fast = 'দ্রুত (Fast)'
}

export interface AudioData {
  data: string;
  mimeType: string;
}

export interface SongRequest {
  genre: string;
  mood: string;
  tempo: Tempo;
  sampleStyle: string;
  targetDuration: number;
  audioSample?: AudioData;
}

export interface SongSection {
  type: string;
  duration: string;
  lyrics: string;
}

export interface Arrangement {
  instruments: string;
  beatPattern: string;
  bpm: string;
  vocalStyle: string;
  energyProgression: string;
}

export interface GeneratedSong {
  title: string;
  sections: SongSection[];
  arrangement: Arrangement;
}
