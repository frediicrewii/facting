export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface GeneratedContent {
  fact: string;
  imageBase64: string;
  timestamp: Date;
}

export interface Recipient {
  chatId: string;
  name: string;
  type: 'user' | 'group' | 'channel' | 'supergroup' | 'unknown';
  selected: boolean;
  joinedAt: Date;
}

export type Topic = 'Random' | 'Science' | 'History' | 'Nature' | 'Space' | 'Technology' | 'Art' | 'Psychology';

export enum BotStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  GENERATING_TEXT = 'GENERATING_TEXT',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  POSTING = 'POSTING',
  WAITING = 'WAITING'
}