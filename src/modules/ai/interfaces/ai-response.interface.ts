export interface AIResponse {
  success: boolean;

  intent: string;

  response: string;

  data?: unknown;
}
