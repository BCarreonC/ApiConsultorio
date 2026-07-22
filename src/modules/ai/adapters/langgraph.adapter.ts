import { Injectable } from '@nestjs/common';

@Injectable()
export class LangGraphAdapter {
  async invoke(message: string) {
    return {
      intent: 'unknown',

      response: `Mock LangGraph: ${message}`,
    };
  }
}
