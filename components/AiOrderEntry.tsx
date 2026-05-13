"use client";
import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { GoogleGenAI, Type } from "@google/genai";
import { getCookie } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
};

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set.");
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

export function AiOrderEntry({ onOrderAdded }: { onOrderAdded: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      text: "Hi! Describe an order to me, and I'll log it. For example: 'Mark ordered 2 coffees at $4 each and 1 pastry at $3 from the main bakery. He lives at 123 Main St and his number is 555-1234. Status is delivery.'",
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    setUserId(getCookie("user_id"));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text: userMessage },
    ]);
    setIsProcessing(true);

    try {
      const ai = getAI();
      // Create schema for JSON output
      const schema = {
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
              "A friendly conversational response back to the user acknowledging what was done or asking for clarification.",
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
              status: {
                type: Type.STRING,
                description: "Must be exactly 'delivery' or 'completed'",
              },
            },
          },
        },
        required: ["confidence", "response_message"],
      };

      // Fetch available inventory so AI can match IDs and prices
      const { data: inventoryData } = await supabase
        .from("inventory")
        .select("id, name, price");
      const inventoryContext =
        inventoryData && inventoryData.length > 0
          ? `Available inventory (id: name: price):\n${inventoryData.map((i: any) => `${i.id}: ${i.name} ($${i.price})`).join("\n")}`
          : "";

      const prompt = [
        inventoryContext,
        ...messages
          .filter((m) => m.role === "user")
          .slice(-3)
          .map((m) => m.text),
        userMessage,
      ]
        .filter(Boolean)
        .join("\n\n");

      const geminiResponse = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!geminiResponse.ok) {
        const errorBody = JSON.parse(await geminiResponse.text());
        // const exactMessage = errorBody.error.message;
        console.log(errorBody);

        throw new Error(`AI request failed: ${errorBody}`);
      }

      const geminiJson = await geminiResponse.json();
      const result = geminiJson?.result;

      if (!result) {
        throw new Error(
          geminiJson?.error || "Invalid AI response from the Gemini API",
        );
      }

      if (
        result.confidence?.toLowerCase() === "high" &&
        result.order_data?.customer?.name
      ) {
        // Attempt to insert into Supabase
        const orderInfo = result.order_data;
        let customerId;
        let deliveryId;

        // 1. Upsert Customer
        const { data: existingCustomer, error: cSearchError } = await supabase
          .from("customers")
          .select("id")
          .eq("name", orderInfo.customer.name)
          .limit(1)
          .maybeSingle();

        const { data: existingDelivery, error: dSearchError } = await supabase
          .from("delivery")
          .select("id")
          .ilike("name", `%${orderInfo.delivery.name}%`)
          .limit(1)
          .maybeSingle();

        if (cSearchError && cSearchError.code !== "PGRST116") {
          throw new Error(`Customer search error: ${cSearchError.message}`);
        }

        if (existingCustomer) {
          customerId = existingCustomer.id;
          // Optionally update phone/address here
        } else {
          const { data: newCustomer, error: cInsError } = await supabase
            .from("customers")
            .insert({
              name: orderInfo.customer.name,
              phone: orderInfo.customer.phone || null,
              address: orderInfo.customer.address || null,
            })
            .select()
            .single();

          if (cInsError)
            throw new Error(`Customer insert error: ${cInsError.message}`);
          customerId = newCustomer.id;
        }
        if (existingDelivery) {
          deliveryId = existingDelivery.id;
        }

        // 2. Insert Order
        let totalPrice = 0;
        if (orderInfo.items && orderInfo.items.length > 0) {
          totalPrice = orderInfo.items.reduce(
            (acc: number, item: any) =>
              acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
            0,
          );
        }

        const status = ["delivery", "completed"].includes(
          orderInfo.status?.toLowerCase(),
        )
          ? orderInfo.status.toLowerCase()
          : "delivery";
        const now = new Date();
        const dateObj =
          new Date(`${orderInfo.date}, ${now.getFullYear()}`) || new Date();
        const timestampTZ = dateObj.toISOString();
        const { data: newOrder, error: oInsError } = await supabase
          .from("orders")
          .insert({
            customer_id: customerId,
            delivery_id: deliveryId,
            status,
            total_price: totalPrice,
            created_at: timestampTZ,
            user_id: userId,
          })
          .select()
          .single();

        if (oInsError)
          throw new Error(`Order insert error: ${oInsError.message}`);

        // 3. Insert Items
        if (orderInfo.items && orderInfo.items.length > 0) {
          const itemsToInsert = orderInfo.items.map((item: any) => ({
            order_id: newOrder.id,
            inventory_id: item.inventory_id || null,
            name: item.name,
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            source: item.source || null,
          }));

          const { error: iInsError } = await supabase
            .from("order_items")
            .insert(itemsToInsert);
          if (iInsError)
            throw new Error(`Items insert error: ${iInsError.message}`);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "ai",
            text: result.response_message || "Order successfully logged!",
          },
        ]);
        onOrderAdded();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "ai",
            text:
              result.response_message ||
              "I couldn't quite understand the order details. Could you clarify?",
          },
        ]);
      }
    } catch (error: any) {
      const msg = error?.message || String(error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          text: `Sorry, I ran into an error: ${msg}. Did you run the SQL script in Supabase?`,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 md:bg-white md:m-4 md:rounded-2xl md:shadow-sm md:border md:border-slate-200 overflow-hidden">
      <div className="hidden md:flex p-4 border-b border-slate-100 items-center justify-between bg-white text-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <h3 className="text-xs font-bold uppercase tracking-wider">
            Order Assistant
          </h3>
        </div>
        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-mono">
          v1.2-AI
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 flex-col ${m.role === "user" ? "items-end" : ""}`}
          >
            <div
              className={`px-4 py-3 rounded-2xl text-xs leading-relaxed max-w-[85%] ${m.role === "user" ? "bg-indigo-600 text-white rounded-br-none shadow-sm" : "bg-slate-100 text-slate-700 rounded-bl-none"}`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-start gap-3 flex-col">
            <div className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-700 rounded-bl-none">
              <div className="font-bold text-indigo-600 mb-1 italic uppercase text-[9px] flex items-center">
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                System Processing...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 pb-24 md:pb-4 bg-white border-t border-slate-100 shrink-0 absolute md:relative bottom-0 left-0 right-0">
        <div className="relative flex flex-col w-full">
          <div className="relative flex items-center w-full">
            <input
              type="text"
              className="w-full bg-[var(--background-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)] pr-12 transition-all"
              placeholder="Type an order desc..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={isProcessing || !input.trim()}
              className="absolute right-2 top-2 bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-[9px] text-[var(--text-secondary)] mt-2 italic px-1">
            Try: "Mark ordered 2 coffees from main bakery at $4. Status
            delivery."
          </p>
        </div>
      </div>
    </div>
  );
}
