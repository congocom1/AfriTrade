import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AssistantMessage from '@/components/assistant/AssistantMessage';

const storageKey = (agent) => `afritrade:launch_conversation:${agent}`;

const readStored = (agent) => {
  try {
    return localStorage.getItem(storageKey(agent));
  } catch {
    return null;
  }
};

const writeStored = (agent, id) => {
  try {
    localStorage.setItem(storageKey(agent), id);
  } catch {
    /* storage unavailable — the thread still works for this visit */
  }
};

export default function LaunchAgentChat({ agent, label, description, suggestions = [] }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [value, setValue] = useState('');
  const conversationRef = useRef(null);
  const subscriptionRef = useRef(null);
  const endRef = useRef(null);

  const subscribeTo = (id) => {
    if (subscriptionRef.current && subscriptionRef.current.id === id) return;
    if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    subscriptionRef.current = {
      id,
      unsubscribe: base44.agents.subscribeToConversation(id, (data) => setMessages(data.messages || [])),
    };
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setMessages([]);
    conversationRef.current = null;
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    (async () => {
      try {
        const list = (await base44.agents.listConversations({ agent_name: agent })) || [];
        const withMessages = list.filter((conversation) => (conversation.messages || []).length > 0);
        let conversation = withMessages[0] || null;
        if (!conversation) {
          const storedId = readStored(agent);
          if (storedId) conversation = await base44.agents.getConversation(storedId).catch(() => null);
        }
        if (cancelled || !conversation) return;
        conversationRef.current = conversation;
        writeStored(agent, conversation.id);
        setMessages(conversation.messages || []);
        subscribeTo(conversation.id);
      } catch {
        /* no thread yet — the empty state is correct */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [agent]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ block: 'end' });
  }, [messages]);

  const send = async (text) => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      let conversation = conversationRef.current;
      if (!conversation) {
        conversation = await base44.agents.createConversation({
          agent_name: agent,
          metadata: { name: label || agent, description: description || '' },
        });
        conversationRef.current = conversation;
        writeStored(agent, conversation.id);
        subscribeTo(conversation.id);
      }
      await base44.agents.addMessage(conversation, { role: 'user', content: body });
    } catch {
      setError(t('launch.chat.sendError'));
    } finally {
      setSending(false);
    }
  };

  const startOver = () => {
    try {
      localStorage.removeItem(storageKey(agent));
    } catch {
      /* nothing stored */
    }
    conversationRef.current = null;
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    setMessages([]);
    setError('');
  };

  const waiting = messages.length > 0 && messages[messages.length - 1].role === 'user';

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('launch.chat.title')}
        </span>
        <button
          type="button"
          onClick={startOver}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" /> {t('launch.chat.newThread')}
        </button>
      </div>

      <div className="min-h-[40vh] flex-1 space-y-3 overflow-y-auto p-3 lg:max-h-[52vh]">
        {loading ? (
          <div className="space-y-3">
            <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-secondary" />
            <div className="h-20 w-3/4 animate-pulse rounded-2xl bg-secondary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="space-y-3 py-4 text-center">
            <p className="text-sm font-semibold">{t('launch.chat.empty')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:border-primary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => <AssistantMessage key={index} message={message} />)
        )}
        {waiting && <p className="text-xs text-muted-foreground">{t('launch.chat.thinking')}</p>}
        <div ref={endRef} />
      </div>

      {error && <p className="border-t border-border px-3 py-2 text-xs font-medium text-destructive">{error}</p>}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(value);
          setValue('');
        }}
        className="flex gap-2 border-t border-border p-3"
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t('launch.chat.placeholder')}
          className="h-10 flex-1 rounded-full border border-border bg-card px-4 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading || sending || !value.trim()}
          aria-label={t('launch.chat.send')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}