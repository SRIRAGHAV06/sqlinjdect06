
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ThreatLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `You are an elite Cybersecurity Expert specializing in SQL Injection (SQLi) detection and database security.
Your task is to analyze the provided SQL query and determine if it's safe or malicious.
Be extremely thorough. Look for tautologies, union-based attacks, blind SQLi, time-based attacks, and stacked queries.

Output MUST be a valid JSON object following this schema:
{
  "status": "Safe" | "Malicious",
  "threatLevel": "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "riskScore": number (0-100),
  "analysis": "string (detailed explanation)",
  "secureVersion": "string (parameterized version or safe alternative)",
  "attackType": "string (optional, e.g., 'Tautology-based', 'UNION-based', etc.)"
}`;

const handleApiError = (error: any): never => {
  const message = error?.message || "";
  
  if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
    throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
  }
  
  if (message.includes("401") || message.includes("API_KEY_INVALID") || message.includes("403")) {
    throw new Error("Invalid API key or insufficient permissions. Please check your configuration.");
  }

  if (message.includes("SAFETY")) {
    throw new Error("The query was flagged by security filters. Please try a different input.");
  }

  if (message.includes("quota")) {
    throw new Error("API quota reached. Please try again later.");
  }

  console.error("Analysis Service Error:", error);
  throw new Error("Analysis failed due to a system error. Please try again later.");
};

export const analyzeQuery = async (query: string): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyze this SQL query for security vulnerabilities: \n\n ${query}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            threatLevel: { type: Type.STRING },
            riskScore: { type: Type.NUMBER },
            analysis: { type: Type.STRING },
            secureVersion: { type: Type.STRING },
            attackType: { type: Type.STRING },
          },
          required: ["status", "threatLevel", "riskScore", "analysis", "secureVersion"]
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      ...result,
      query,
      timestamp: Date.now(),
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export interface QuickCheckResult {
  score: number;
  label: 'safe' | 'suspicious' | 'malicious';
}

export const quickCheckQuery = async (query: string): Promise<QuickCheckResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a rapid security triage on this SQL query. Return a risk score (0-100) and a label ('safe', 'suspicious', or 'malicious'). \n\n QUERY: ${query}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            label: { type: Type.STRING },
          },
          required: ["score", "label"]
        }
      }
    });
    return JSON.parse(response.text || '{"score": 0, "label": "safe"}');
  } catch (e) {
    console.warn("Quick check background failure:", e);
    return { score: 0, label: 'safe' };
  }
};
