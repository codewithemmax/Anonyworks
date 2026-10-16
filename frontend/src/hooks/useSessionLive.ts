import { useEffect, useState } from 'react';

type Message = {
  id: number;
  original_message: string;
  processed_message: string;
  is_professional: boolean;
  created_at: string;
};

export const useSessionLive = (sessionId: string | undefined, initialMessages: Message[]) => {
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!sessionId) return;

    const refreshMessages = async () => {
      try {
        const response = await fetch(`/api/session/${sessionId}/messages`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
        });
        if (!response.ok) return;

        const data = await response.json();
        if (data.success) setMessages(data.messages);
      } catch {
        // The initial dashboard data remains visible if polling temporarily fails.
      }
    };

    const timer = window.setInterval(refreshMessages, 15000);
    return () => window.clearInterval(timer);
  }, [sessionId]);

  return messages;
};
