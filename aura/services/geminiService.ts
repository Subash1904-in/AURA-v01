import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "../constants";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are Aura, a helpful, concise, and elegant AI assistant. Keep responses brief (under 3 sentences) and conversational, suitable for a voice-first kiosk interface. Do not use markdown formatting like bolding or lists, just plain text.",
      },
    });
    return response.text || "I'm sorry, I didn't catch that.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting right now.";
  }
};