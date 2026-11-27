'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChatMessage, SseEvent, SuggestionChip } from '../lib/assistant-types';
import { validateAndExecuteAction, syncAllowlistedRoutes } from '../lib/assistant-action-handler';
import { getAuthToken } from '../lib/http-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const VISITOR_SESSION_KEY = 'lendgrid_assistant_visitor_session';

function toStaticChips(labels: string[]): SuggestionChip[] {
  return labels.map((label, idx) => ({
    id: `static_${idx}`,
    label,
    action: 'message',
    target: label,
    contextual: false,
  }));
}

function generateOpaqueSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `sess_${crypto.randomUUID()}`;
  }
  return `sess_${Math.random().toString(36).substring(2, 15)}`;
}

export function useAssistantChat(currentUser?: any) {
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionChip[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync allowlisted routes from backend on mount to prevent drift
  useEffect(() => {
    syncAllowlistedRoutes(API_BASE_URL);
  }, []);

  // Initialize or restore session ID; reset on user logout or user change
  useEffect(() => {
    const currentUserId = currentUser?._id || currentUser?.id || null;

    if (currentUserId !== lastUserId) {
      setLastUserId(currentUserId);
      setIsOpen(false);
      setMessages([]);
      setSuggestions([]);

      if (currentUserId) {
        setSessionId(generateOpaqueSessionId());
      } else {
        // Visitor session with 24-hr TTL
        let visData = localStorage.getItem(VISITOR_SESSION_KEY);
        if (visData) {
          try {
            const parsed = JSON.parse(visData);
            const isExpired = Date.now() - parsed.created > 24 * 60 * 60 * 1000;
            if (!isExpired && parsed.id) {
              setSessionId(parsed.id);
              return;
            }
          } catch {
            // ignore corrupt data
          }
        }
        const newVisId = generateOpaqueSessionId();
        localStorage.setItem(VISITOR_SESSION_KEY, JSON.stringify({ id: newVisId, created: Date.now() }));
        setSessionId(newVisId);
      }
    }
  }, [currentUser, lastUserId]);

  // Set default suggestions based on role / mode (never overwrite while streaming)
  useEffect(() => {
    if (isStreaming || suggestions.length > 0) return;

    if (!currentUser) {
      setSuggestions(
        toStaticChips([
          'How do I become a DSA partner?',
          'What commission rates are offered?',
          'Which lenders are available?',
          'Talk to our partnership team',
        ]),
      );
    } else {
      const normalizedRole = String(currentUser?.role || '')
        .toLowerCase()
        .replace(/\s+/g, '_');

      if (normalizedRole === 'aggregator_admin' || normalizedRole === 'super_admin') {
        setSuggestions(
          toStaticChips([
            'Show my dashboard metrics',
            'My ticket summary',
            'What is my pending commission?',
            'Filter approved applications',
            'Check my profile completion',
          ]),
        );
      } else if (normalizedRole === 'aggregator_member') {
        setSuggestions(
          toStaticChips([
            'My submitted applications',
            'My ticket summary',
            'How do I complete loan files?',
            'Lender partner products',
          ]),
        );
      } else {
        setSuggestions(
          toStaticChips([
            'Show my dashboard metrics',
            'My ticket summary',
            'Which lenders are available?',
          ]),
        );
      }
    }
  }, [currentUser, isStreaming, suggestions.length]);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStatusText(null);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMsgId = `msg_u_${Date.now()}`;
      const assistantMsgId = `msg_a_${Date.now()}`;

      const userMessage: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const initialAssistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Append messages, guarding against duplicate IDs
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== userMsgId && m.id !== assistantMsgId);
        return [...filtered, userMessage, initialAssistantMessage];
      });

      setIsStreaming(true);
      setStatusText('Connecting...');
      setSuggestions([]); // Collapse suggestions on message submit

      abortControllerRef.current = new AbortController();

      try {
        let visitorToken: string | null = null;
        if (!currentUser) {
          try {
            const visData = localStorage.getItem(VISITOR_SESSION_KEY);
            if (visData) visitorToken = JSON.parse(visData)?.visitorToken || null;
          } catch {}
        }

        const authToken = getAuthToken();

        const response = await fetch(`${API_BASE_URL}/api/v1/assistant/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            ...(visitorToken ? { 'x-assistant-visitor-token': visitorToken } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            message: trimmed,
            sessionId: sessionId || undefined,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported by response');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith('data:')) continue;

            const jsonStr = trimmedLine.replace(/^data:\s*/, '');
            if (!jsonStr) continue;

            try {
              const event: SseEvent = JSON.parse(jsonStr);

              switch (event.type) {
                case 'session':
                  if ((event as any).sessionId) {
                    setSessionId((event as any).sessionId);
                    if (!currentUser) {
                      localStorage.setItem(
                        VISITOR_SESSION_KEY,
                        JSON.stringify({
                          id: (event as any).sessionId,
                          visitorToken: (event as any).visitorToken || visitorToken || null,
                          created: Date.now(),
                        }),
                      );
                    }
                  }
                  break;

                case 'status':
                  setStatusText(event.text || null);
                  break;

                case 'text-delta':
                  setStatusText(null);
                  if (event.text) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMsgId
                          ? { ...msg, content: msg.content + event.text }
                          : msg,
                      ),
                    );
                  }
                  break;

                case 'ui-action':
                  if (event.action) {
                    const actionResult = validateAndExecuteAction(
                      event.action,
                      event.payload,
                      currentUser?.role || 'visitor',
                      router,
                      pathname,
                    );
                    if (actionResult.executed) {
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMsgId
                            ? {
                                ...msg,
                                uiAction: { action: event.action!, payload: event.payload },
                              }
                            : msg,
                        ),
                      );
                    }
                  }
                  break;

                case 'suggestions':
                  if (Array.isArray(event.suggestedReplies) && event.suggestedReplies.length > 0) {
                    setSuggestions(event.suggestedReplies);
                  } else if (Array.isArray(event.items)) {
                    setSuggestions(toStaticChips(event.items));
                  }
                  break;

                case 'done':
                  setStatusText(null);
                  setIsStreaming(false);
                  if (event.messageId) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMsgId ? { ...msg, id: event.messageId! } : msg,
                      ),
                    );
                  }
                  break;

                case 'error':
                  setStatusText(null);
                  setIsStreaming(false);
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? {
                            ...msg,
                            content:
                              msg.content ||
                              event.message ||
                              'An error occurred. Please try again.',
                          }
                        : msg,
                    ),
                  );
                  break;
              }
            } catch (err: any) {
              console.warn('[Assistant SSE] Parse error for line:', line, err);
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setStatusText(null);
          setIsStreaming(false);
          return;
        }

        console.error('[Assistant Chat Error]:', err);
        setStatusText(null);
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    msg.content ||
                    'Unable to connect to the assistant service. Please check your connection or contact support.',
                }
              : msg,
          ),
        );
      } finally {
        setIsStreaming(false);
        setStatusText(null);
      }
    },
    [isStreaming, sessionId, currentUser, router, pathname],
  );

  const submitFeedback = useCallback(
    async (messageId: string, rating: 'positive' | 'negative', comment?: string) => {
      try {
        const authToken = getAuthToken();
        await fetch(`${API_BASE_URL}/api/v1/assistant/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            sessionId,
            messageId,
            rating,
            comment,
          }),
        });

        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, feedback: rating } : msg)),
        );
      } catch (err: any) {
        console.error('[Assistant Feedback Error]:', err);
      }
    },
    [sessionId],
  );

  const clearSession = useCallback(async () => {
    abortStream();
    if (sessionId) {
      try {
        let visitorToken: string | null = null;
        if (!currentUser) {
          try {
            const visData = localStorage.getItem(VISITOR_SESSION_KEY);
            if (visData) visitorToken = JSON.parse(visData)?.visitorToken || null;
          } catch {}
        }

        const authToken = getAuthToken();
        await fetch(`${API_BASE_URL}/api/v1/assistant/session/${sessionId}`, {
          method: 'DELETE',
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            ...(visitorToken ? { 'x-assistant-visitor-token': visitorToken } : {}),
          },
          credentials: 'include',
        });
      } catch (err: any) {
        console.warn('Error clearing remote session:', err);
      }
    }

    setMessages([]);
    setSuggestions([]);
    setStatusText(null);
    if (!currentUser) {
      localStorage.removeItem(VISITOR_SESSION_KEY);
    }
    const nextSess = generateOpaqueSessionId();
    setSessionId(nextSess);
  }, [abortStream, sessionId, currentUser]);

  const executeSuggestion = useCallback(
    (chip: SuggestionChip) => {
      if (isStreaming || !chip) return;
      if (chip.action === 'navigate') {
        const res = validateAndExecuteAction(
          'navigate',
          { route: chip.target },
          currentUser?.role || 'visitor',
          router,
          pathname,
        );
        if (!res.executed) {
          sendMessage(chip.label);
        }
        return;
      }
      sendMessage(chip.target || chip.label);
    },
    [isStreaming, currentUser, router, pathname, sendMessage],
  );

  return {
    isOpen,
    setIsOpen,
    messages,
    statusText,
    isStreaming,
    suggestions,
    sendMessage,
    executeSuggestion,
    abortStream,
    clearSession,
    submitFeedback,
  };
}

