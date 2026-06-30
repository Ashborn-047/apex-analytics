import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

type PersistedMessage = Omit<Message, "timestamp"> & { timestamp: string };

interface ChatContextType {
  messages: Message[];
  addMessage: (msg: Message) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  clearChat: () => void;
}

const DEFAULT_WELCOME: Message = {
  sender: "bot",
  text: "System initialized. I am APEX Bot, your elite F1 Race Strategy and Analytics Assistant. Ask me any analytical question, and I will compile telemetry, historical database schemas, and predictions to assist you.",
  timestamp: new Date(),
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("apex_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert ISO strings back to Date objects
        return parsed.map((m: PersistedMessage) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        console.error("Failed to parse chat history from localStorage", e);
      }
    }
    return [DEFAULT_WELCOME];
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("apex_chat_history", JSON.stringify(messages));
  }, [messages]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const clearChat = () => {
    setMessages([DEFAULT_WELCOME]);
    localStorage.removeItem("apex_chat_history");
  };

  return (
    <ChatContext.Provider value={{ messages, addMessage, loading, setLoading, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
