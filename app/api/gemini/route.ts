import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION =
  "You are an AI order entry assistant for an online shop. Extract order information from the user's message. If it's a valid order description, output high confidence, provide a friendly response acknowledging what was done or asking for clarification, and populate the order_data structure. Match product names to available inventory items when possible. If the user didn't specify a price, use the inventory price or a reasonable fallback. If the order is for delivery, extract delivery name. If the user did not describe an order, return low confidence and a conversational reply.";

const orderSchema = {
  type: Type.OBJECT,
  properties: {
    confidence: {
      type: Type.STRING,
      description:
        "High if the user clearly described an order, Low if it's just chit-chat.",
    },
    response_message: {
      type: Type.STRING,
      description:
        "A friendly conversational response acknowledging the order or asking for clarification.",
    },
    order_data: {
      type: Type.OBJECT,
      description:
        "The extracted order data. Leave empty if confidence is Low.",
      properties: {
        customer: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            phone: { type: Type.STRING },
            address: { type: Type.STRING },
          },
          required: ["name"],
        },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              inventory_id: {
                type: Type.STRING,
                description:
                  "If the item strictly matches one of the available inventory items, provide its UUID here.",
              },
              name: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              price: { type: Type.NUMBER },
              source: { type: Type.STRING },
            },
            required: ["name", "quantity", "price"],
          },
        },
        delivery_id: {
          type: Type.STRING,
          description:
            "If the delivery strictly matches one of the available delivery, provide its UUID here.",
        },
        status: {
          type: Type.STRING,
          description: "Must be exactly 'delivery' or 'completed'",
        },
      },
    },
  },
  required: ["confidence", "response_message"],
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 },
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1. The outer try block catches network/API errors from Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [prompt],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: orderSchema,
      },
    });

    const rawText = response.text ?? "";
    let jsonStr = rawText.trim();

    // Clean up Markdown code blocks if they exist
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr
        .replace(/^```json/, "")
        .replace(/```$/, "")
        .trim();
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "").trim();
    }

    // 2. The inner try block handles JSON parsing failures
    try {
      const result = JSON.parse(jsonStr);
      return NextResponse.json({ result, rawText }, { status: 200 });
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return NextResponse.json(
        {
          error: "Failed to parse AI output as JSON.",
          // Safely extract the message rather than sending a full object
          details:
            parseError instanceof Error
              ? parseError.message
              : "Unknown parsing error",
          rawText,
        },
        { status: 500 },
      );
    }
  } catch (geminiError) {
    // 3. Catch and format errors thrown directly by the Gemini API
    return NextResponse.json(
      geminiError instanceof Error ? geminiError.message : String(geminiError),
      { status: 502 }, // 502 Bad Gateway is appropriate for upstream API failures
    );
  }
}
