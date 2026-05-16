"use client";
import React, { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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

export function AiOrderEntry() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      text: "Hi! Describe an order to me, and I'll log it. For example: 'Mark ordered 2 coffees at $4 each and 1 pastry at $3 from the main bakery. He lives at 123 Main St and his number is 555-1234. Status is delivery.'",
    },
    {
      id: "2",
      role: "ai",
      text: "Hi! Describe an order to me, and I'll log it. For example: 'Mark ordered 2 coffees at $4 each and 1 pastry at $3 from the main bakery. He lives at 123 Main St and his number is 555-1234. Status is delivery.'",
    },
    {
      id: "3",
      role: "ai",
      text: "Hi! Describe an order to me, and I'll log it. For example: 'Mark ordered 2 coffees at $4 each and 1 pastry at $3 from the main bakery. He lives at 123 Main St and his number is 555-1234. Status is delivery.'",
    },
    {
      id: "4",
      role: "ai",
      text: "Hi! Describe an order to me, and I'll log it. For example: 'Mark ordered 2 coffees at $4 each and 1 pastry at $3 from the main bakery. He lives at 123 Main St and his number is 555-1234. Status is delivery.'",
    },
    {
      id: "5",
      role: "ai",
      text: "Hi! Describe an order to me, and I'll log it. For example: 'Mark ordered 2 coffees at $4 each and 1 pastry at $3 from the main bakery. He lives at 123 Main St and his number is 555-1234. Status is delivery.'",
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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
          .ilike("name", `%${orderInfo?.delivery?.name}%`)
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
        void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
        void queryClient.invalidateQueries({ queryKey: ["deliveries"] });
        void queryClient.invalidateQueries({ queryKey: ["delivery-list"] });
        void queryClient.invalidateQueries({ queryKey: ["customers"] });
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
      console.log(msg);

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

  // Add this alongside your other state/refs

  // Update your auto-scroll useEffect:
  useEffect(() => {
    if (messagesContainerRef.current) {
      // This tells ONLY the message container to scroll to its absolute bottom
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  return (
    <div className="flex h-[calc(90dvh-2rem)] flex-col overflow-hidden bg-white md:m-4 md:h-[calc(90dvh-2rem)] md:rounded-3xl md:border md:border-slate-200 md:shadow-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Order Assistant
            </h3>

            <p className="text-[11px] text-slate-500">Online</p>
          </div>
        </div>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">
          v1.2-AI
        </span>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto bg-slate-50 px-3 py-4"
        ref={messagesContainerRef}
      >
        <div className="flex w-full flex-col gap-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-3xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "rounded-br-md bg-indigo-600 text-white"
                    : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-3xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-slate-500 shadow-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />

                <span className="text-xs">Typing...</span>
              </div>
            </div>
          )}

          {/* <div ref={messagesEndRef} /> */}
        </div>
      </div>

      {/* Input */}
      {/* REMOVED: absolute bottom-0 right-0 left-0 */}
      {/* ADDED: shrink-0 so it never compresses when messages get long */}
      <div className="shrink-0 border-t border-slate-100 bg-white p-2">
        <div className="flex w-full items-end gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
          <textarea
            rows={1}
            value={input}
            disabled={isProcessing}
            placeholder="Type a message..."
            onChange={(e) => {
              setInput(e.target.value);

              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(
                e.target.scrollHeight,
                140,
              )}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="max-h-[140px] flex-1 resize-none overflow-y-auto bg-transparent px-2 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />

          <button
            onClick={handleSend}
            disabled={isProcessing || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50"
            aria-label="Send message"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>

        <p className="mt-2 px-2 text-[10px] text-slate-400">
          Try: "Mark ordered 2 coffees from main bakery at $4. Status delivery."
        </p>
      </div>
    </div>
  );
}
