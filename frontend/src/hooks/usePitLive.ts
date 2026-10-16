import { useState, useEffect } from 'react';

export const usePitLive = (pitId: string | undefined, initialMessages: any[]) => {
  const [messages, setMessages] = useState(initialMessages);

  // Sync state if initialMessages changes (e.g., on first fetch)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!pitId) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/pit/${pitId}/messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) setMessages(data.messages);
      }
    }, 15000);
    return () => window.clearInterval(timer);
  }, [pitId]);

  return messages;
};
