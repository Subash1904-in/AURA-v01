import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "../constants";
import { searchWithContext, formatSearchResultsForAI, getInformationByIntent, QueryIntent } from "./searchService";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateResponse = async (prompt: string): Promise<string> => {
  try {
    // Classify the user intent
    const { intent, results, formattedContext } = await searchWithContext(prompt, 3);

    // Build enhanced prompt with context
    let enhancedPrompt = prompt;

    // Add specific context based on intent
    if (results.length > 0) {
      const contextInfo = formattedContext ?? formatSearchResultsForAI(results);
      enhancedPrompt = `User Query: ${prompt}\n\n${contextInfo}\n\nProvide a brief, accurate answer based on the above information.`;
    } else if (intent !== QueryIntent.GENERAL && intent !== QueryIntent.NAVIGATION) {
      const intentInfo = getInformationByIntent(intent, prompt);
      enhancedPrompt = `User Query: ${prompt}\n\nRelevant College Information:\n${intentInfo}\n\nProvide a brief, accurate answer based on the above information.`;
    }

    // Build system instruction based on intent
    let systemInstruction = "You are AURA, an AI assistant developed in the AI & DS department at KSSEM. If asked who you are or what your name is, reply: 'I am AURA, developed in the AI & DS department.' Never say you are Gemini. Keep responses brief (under 3 sentences for simple queries, up to 5 sentences for complex ones) and conversational, suitable for a voice-first kiosk interface. Do not use markdown formatting like bolding or lists, just plain text. Always provide accurate information from the provided college database.";

    if (intent === QueryIntent.CONTACT) {
      systemInstruction += " When providing contact information, include names, phone numbers, and email addresses clearly.";
    } else if (intent === QueryIntent.PLACEMENT) {
      systemInstruction += " When discussing placements, mention specific batch statistics and company names when available.";
    } else if (intent === QueryIntent.NAVIGATION) {
      systemInstruction += " For navigation queries, provide clear directions and building/floor information.";
    }

    // Add high priority event instruction
    systemInstruction += " If asked about the ICDCA conference, Big news, upcoming events, big news, explicitly announce the 'International Conference on Data Science for Cyber-Physical Systems Resilience using Advanced Applications (ICDCA-2026)' as a major, prestigious event for KSSEM.";

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: enhancedPrompt,
      config: {
        systemInstruction,
      },
    });

    return response.text || "I'm sorry, I didn't catch that.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting right now.";
  }
};