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
      return 'Connection failed: Backend is not running.\n\n' +
             'To fix: Open a terminal and run:\n' +
             '  cd chat-app-backend && npm start\n\n' +
             'The backend must be running on http://localhost:3000';
    }

    if (error.status === 404) {
      return `Chat API endpoint not found: ${this.apiUrl}\n\n` +
             'Check that your backend is running and the URL is correct.';
    }

    if (error.status === 500) {
      return 'Backend server error (500). Check the backend console for error details.\n\n' +
             'Common issues:\n' +
             '- Missing GEMINI_API_KEY in .env file\n' +
             '- API key is invalid or revoked\n' +
             '- Backend service crashed';
    }

    return `Chat API request failed with status ${error.status}.`;
  }
}
