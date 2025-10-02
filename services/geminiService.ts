import { GoogleGenAI } from "@google/genai";
import type { Policy } from '../types';

// FIX: Aligned with Gemini API coding guidelines by removing explicit API key checks
// and directly using process.env.API_KEY, assuming it's always available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const geminiService = {
  generateAIAssistance: async (policy: Policy, userPrompt: string): Promise<string> => {
    const allRequirementsSummaryHTML = policy.requirements
      .map(r => `
        <li style="margin-bottom: 12px; padding-left: 5px;">
          <strong style="font-size: 16px; color: #333;">${r.name}</strong> - Status: <span style="font-weight: bold;">${r.status}</span><br>
          <span style="color: #555555;">${r.description}</span>
        </li>
      `)
      .join('');

    const prompt = `
      You are an expert, friendly, and professional insurance agent assistant for the "Bill Layne Insurance Agency".
      Your task is to generate a complete, client-facing HTML email based on a specific request from an agent.

      **AGENT CONTEXT:**
      The email is regarding the following policy:
      - Client Name: ${policy.clientName}
      - Client Phone: ${policy.clientPhone}
      - Policy Number: ${policy.policyNumber}
      - Carrier: ${policy.carrier}
      - Policy Type: ${policy.policyType}
      - Full Requirement Status Summary:
        <ul style="list-style-type: none; padding: 0;">
            ${allRequirementsSummaryHTML}
        </ul>
        ${policy.requirements.length === 0 ? '  - No requirements listed for this policy.' : ''}

      **AGENT'S REQUEST:**
      "${userPrompt}"

      **EMAIL REQUIREMENTS:**
      Generate a complete, single HTML file. The output MUST start with \`<!DOCTYPE html>\` and be ONLY HTML code.

      **1. Preheader (VERY IMPORTANT):**
        - Immediately after the opening \`<body>\` tag, insert a hidden preheader div.
        - This prevents email clients like Gmail from showing the subject line in the email body.
        - Use this exact code for the preheader:
          \`<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>\`

      **2. Overall Structure & Styling:**
        - Use a fluid, table-based layout for maximum email client compatibility (especially Gmail).
        - The outer \`<body>\` should have a light gray background: \`#f8fafc\`.
        - The main email container should be a centered table with a \`max-width: 600px\`.
        - The content container table rows should have a white background (\`#ffffff\`), with the overall table having rounded corners (\`border-radius: 12px\`) and a subtle shadow (\`box-shadow: 0 4px 12px rgba(0,0,0,0.05);\`).
        - Use inline CSS for all styling within the body.
        - Use the font family: \`'Plus Jakarta Sans', 'Segoe UI', Inter, Arial, sans-serif\`.

      **3. Header Section:**
        - Create a header cell with a gradient background: \`linear-gradient(135deg, #003366, #1a5f7a)\`.
        - Inside the header, center-align the text.
        - Display the agency name \`Bill Layne Insurance Agency\` as an \`<h1>\` with white text (\`#ffffff\`), bold, and font-size around \`28px\`.
        - Below the name, display the tagline \`Protecting North Carolina Families\` as a \`<p>\` tag with white text (\`#ffffff\`, opacity \`.92\`) and font-size around \`16px\`.

      **4. Body Content:**
        - Based on the agent's request, write a friendly, professional, and clear message.
        - The text color should be a dark gray like \`#1f2937\`.
        - Use emojis sparingly and appropriately to add a warm, human touch (e.g., 📄, 🙏, 👍).
        - End the main message with a warm closing like "Warmly,".

      **5. Signature:**
        - After the closing, include the following signature block:
          <p style="font-family: Arial, sans-serif; font-size: 14px; color: #333333;">
              <strong>The Team at Bill Layne Insurance Agency</strong><br>
              Your Service Team<br>
              Phone: <a href="tel:3368351993" style="color: #003366; text-decoration: none;">336-835-1993</a><br>
              Email: <a href="mailto:Save@NCAutoandHome.com" style="color: #003366; text-decoration: none;">Save@NCAutoandHome.com</a><br>
              Website: <a href="https://www.billlayneinsurance.com/" style="color: #003366; text-decoration: none;" target="_blank">www.billlayneinsurance.com</a>
          </p>

      **6. Footer Section:**
        - Create a final table row \`<tr>\` for the footer.
        - The footer cell \`<td>\` should have a background of \`#f8fafc\`, padding, center-aligned text, and a top border (\`1px solid #e2e8f0\`).
        - Inside, add the following, in order:
          - Agency Name (\`Bill Layne Insurance Agency\`) as a bold paragraph.
          - Address (\`1283 N Bridge St, Elkin, NC 28621\`) as a paragraph.
          - Phone and Email links, separated by a pipe character.
          - Website link.
          - A small table for social media icons:
            - Facebook icon (\`https://raw.githubusercontent.com/BillLayne/bill-layne-images/5657f7d5b50febe47431864b103e9823806f6d13/logos/facebook%20logo.webp\`) linked to \`https://facebook.com/BillLayneInsurance\`.
            - Google icon (\`https://raw.githubusercontent.com/BillLayne/bill-layne-images/5657f7d5b50febe47431864b103e9823806f6d13/logos/google%20image%20link.webp\`) linked to \`https://g.page/r/CXGq9B7-jzu7EBM/review\`.
          - A "Review Us on Google" button, styled with a yellow background (\`#FFC300\`) and dark text, linking to \`https://g.page/r/CXGq9B7-jzu7EBM/review\`.

      **7. Dark Mode Support:**
        - Include a \`<style>\` block in the \`<head>\` with CSS for dark mode. Use both \`@media (prefers-color-scheme: dark)\` and \`[data-ogsc]\` selectors for broad compatibility.
        - In dark mode:
          - The outer background should be \`#111827\`.
          - The content and footer container backgrounds should be \`#1f2937\`.
          - All main text (\`p\`, \`h1\`, etc.) should be a light gray: \`#e5e7eb\`.
          - Links in the signature and footer should change to a brighter color like \`#FFC300\`.
          - The review button's colors should remain bright and legible.

      Remember, the final output must be a single, complete, and valid HTML document with no other text or explanation.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      // A simple fix to ensure the output is always valid HTML, even if the model adds markdown fences.
      const rawText = response.text;
      const htmlStartIndex = rawText.indexOf('<!DOCTYPE html>');
      if (htmlStartIndex !== -1) {
        return rawText.substring(htmlStartIndex);
      }
      return rawText;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return "<html><body>There was an error generating the response. Please check the console for details.</body></html>";
    }
  },
};