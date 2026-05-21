// export interface Message {}

export interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp?: string;
}
