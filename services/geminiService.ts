import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// Note: In a real deployment, ensure process.env.API_KEY is set.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a structured Telegram post in Russian based on the topic.
 */
export const generateFact = async (topic: string): Promise<string> => {
  try {
    const topicPrompt = topic === 'Random' ? 'history, science, nature, or technology' : topic.toLowerCase();
    
    const prompt = `
      Create an engaging, lively Telegram channel post about ${topicPrompt} in Russian.
      
      Structure:
      1. Headline: A short, catchy title with a relevant emoji at the start, wrapped in <b> tags.
      2. Body: An interesting, mind-blowing fact. Use <i> tags for key emphasis if needed. The tone should be like a popular science channel (curious, exciting).
      3. Footer: 2-3 relevant hashtags in Russian.

      Constraints:
      - Language: Russian (Русский).
      - Format: Use HTML tags (<b>, <i>, <u>, <s>, <a>) strictly. Do not use Markdown (**).
      - Length: Keep it concise (under 500 characters) but expressive.
      - No preamble. Start directly with the headline.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text?.trim() || "Не удалось сгенерировать факт.";
  } catch (error) {
    console.error("Error generating fact:", error);
    throw new Error("Failed to generate fact from Gemini.");
  }
};

/**
 * Generates an image based on a prompt (usually the fact).
 */
export const generateImageForFact = async (fact: string): Promise<string> => {
  try {
    // Strip HTML tags for the image prompt to avoid confusing the model
    const cleanFact = fact.replace(/<[^>]*>/g, '');

    const prompt = `
      Create a hyper-realistic, cinematic, high-quality photograph or digital art illustrating this concept: "${cleanFact}". 
      Style: 4k resolution, detailed texture, dramatic lighting, photorealistic, National Geographic style. 
      No text inside the image.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        // Nano Banana models do not support responseMimeType
      }
    });

    // Extract image from response
    // Iterate through parts to find inlineData
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data; // Return base64 string
        }
      }
    }
    
    throw new Error("No image data found in response.");
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image from Gemini.");
  }
};