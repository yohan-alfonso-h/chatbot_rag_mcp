import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_RUNTIME_CONFIG } from '../app-runtime-config';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(APP_RUNTIME_CONFIG).apiUrl;

  async sendMessageToLLM(message: string): Promise<string> {
    try {
      const { reply } = await firstValueFrom(
        this.http.post<{ reply: string }>(this.apiUrl, { message }),
      );

      return reply;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        throw new Error(this.getHttpErrorMessage(error));
      }

      throw new Error('Unexpected error while sending the message.');
    }
  }

  private getHttpErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Unable to connect to the chat API. Check that your backend is running and CORS is enabled.';
    }

    if (error.status === 404) {
      return `Chat API endpoint not found: ${this.apiUrl}`;
    }

    return `Chat API request failed with status ${error.status}.`;
  }
}
