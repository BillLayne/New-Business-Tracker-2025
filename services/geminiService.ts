import type { Policy } from '../types';

export const geminiService = {
  generateAIAssistance: async (policy: Policy, userPrompt: string): Promise<string> => {
    try {
      const response = await fetch('/.netlify/functions/generate-ai-assistance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ policy, userPrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
        console.error('Error from serverless function:', errorData.error);
        throw new Error(`Serverless function failed: ${errorData.error || response.statusText}`);
      }

      const { htmlContent } = await response.json();
      return htmlContent;
    } catch (error) {
      console.error("Error calling Gemini service function:", error);
      return "<html><body>There was an error generating the response. Please check the console for details.</body></html>";
    }
  },
};
