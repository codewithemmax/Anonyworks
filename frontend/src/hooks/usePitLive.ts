import { useState, useEffect } from 'react';

export const usePitLive = (pitId: string | undefined, initialMessages: any[]) => {
  const [messages, setMessages] = useState(initialMessages);

  // Sync state if initialMessages changes (e.g., on first fetch)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!pitId) return;

    // 1. Point to your backend port (3001)
    // In usePitLive.ts
     const host = 'anonyworks.onrender.com'; // Your Render host
     const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
     const socket = new WebSocket(`${protocol}://anonyworks.onrender.com`);

    socket.onopen = () => {
      // 2. Tell the backend which Pit we are watching
      socket.send(JSON.stringify({ type: 'join', pitId }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'newMessage') {
        // 3. Add new message to the top of the state
        setMessages((prev) => [data.message, ...prev]);
      }
    };

    socket.onerror = (err) => console.error('WS Error:', err);

    return () => socket.close();
  }, [pitId]);

  return messages;
};
