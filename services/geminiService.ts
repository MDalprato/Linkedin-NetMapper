
import { GoogleGenAI } from "@google/genai";
import { LinkedInConnection } from "../types";

export const getNetworkInsights = async (connections: LinkedInConnection[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Sample data to avoid hitting token limits while providing enough context
  const sample = connections.slice(0, 50).map(c => `${c.position} at ${c.company}`).join(', ');
  const companyCounts = connections.reduce((acc: Record<string, number>, curr) => {
    acc[curr.company] = (acc[curr.company] || 0) + 1;
    return acc;
  }, {});
  
  const topCompanies = Object.entries(companyCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => `${name} (${count})`)
    .join(', ');

  const prompt = `
    Analyze this professional network data from a LinkedIn export.
    Top Companies: ${topCompanies}
    Sample Roles: ${sample}
    Total Connections: ${connections.length}

    Please provide:
    1. A summary of the network's industry focus.
    2. Potential career opportunities or transitions suggested by this network.
    3. Three specific networking strategies for this user based on their current reach.
    Format the response in clean Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("AI Insights Error:", error);
    return "Failed to generate AI insights. Check your network size or try again later.";
  }
};
