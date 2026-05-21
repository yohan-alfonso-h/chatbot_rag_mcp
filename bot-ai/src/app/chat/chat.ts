import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../interfaces/message';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  @ViewChild('messagesContainer')
  private messagesContainer?: ElementRef<HTMLDivElement>;

  history = signal<Message[]>([]);
  loading = signal(false);
  error = signal('');
  message = signal('');

  constructor(private readonly chatService: ChatService) {}

  sendMessage(): void {
    const content = this.message().trim();

    if (!content || this.loading()) {
      return;
    }

    this.addMessage('user', content);
    this.message.set('');
    this.error.set('');
    this.scrollToBottom();

    void this.askLLM(content);
  }

  async askLLM(prompt: string): Promise<void> {
    this.loading.set(true);

    try {
      const response = await this.chatService.sendMessageToLLM(prompt);
      this.addMessage('bot', response);
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to get a response. Please try again.',
      );
    } finally {
      this.loading.set(false);
      this.scrollToBottom();
    }
  }

  private addMessage(role: Message['role'], content: string): void {
    this.history.update((messages) => [
      ...messages,
      {
        role,
        content,
        timestamp: this.getTimestamp(),
      },
    ]);
  }

  private getTimestamp(): string {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private scrollToBottom(): void {
    window.setTimeout(() => {
      const container = this.messagesContainer?.nativeElement;

      if (!container) {
        return;
      }

      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    });
  }
}
