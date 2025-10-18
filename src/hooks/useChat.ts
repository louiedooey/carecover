import { useState, useCallback } from 'react';
import { Message, ChatSession } from '../types';
import { sendChatRequest, sendStreamingChatRequest } from '../utils/interfazeApi';
import { useLanguage } from '../contexts/LanguageContext';

export interface UseChatOptions {
  enableStreaming?: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface UseChatReturn {
  sendMessage: (content: string, session: ChatSession) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
  clearError: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentLanguage } = useLanguage();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendMessage = useCallback(async (content: string, session: ChatSession) => {
    if (!content.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Create user message
      const userMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: content.trim(),
        sender: 'user',
        timestamp: new Date(),
        type: 'text'
      };

      // Add user message to session
      session.messages.push(userMessage);

      // Prepare messages for API call
      const messages = [...session.messages];
      const documents = [...session.documentCache.insurance, ...session.documentCache.medical];

      // Include attachment text from recent messages in the context
      const messagesWithAttachments = messages.map(message => {
        if (message.attachments && message.attachments.length > 0) {
          const attachmentTexts = message.attachments
            .filter(attachment => attachment.extractedText && attachment.extractionStatus === 'completed')
            .map(attachment => `[Document: ${attachment.fileName}]\n${attachment.extractedText}`)
            .join('\n\n');
          
          if (attachmentTexts) {
            return {
              ...message,
              content: message.content + (message.content ? '\n\n' : '') + attachmentTexts
            };
          }
        }
        return message;
      });

      let botResponse = '';

      if (options.enableStreaming) {
        // Use streaming for real-time response
        const streamGenerator = sendStreamingChatRequest(messagesWithAttachments, documents, {
          model: options.model,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          language: currentLanguage
        });

        // Create initial bot message
        const botMessage: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: '',
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        };

        session.messages.push(botMessage);

        // Stream the response
        for await (const chunk of streamGenerator) {
          botResponse += chunk;
          botMessage.content = botResponse;
          // Trigger re-render by updating the session
          session.updatedAt = new Date();
        }
      } else {
        // Use regular API call
        const response = await sendChatRequest(messagesWithAttachments, documents, {
          model: options.model,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          language: currentLanguage
        });

        botResponse = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

        // Create bot message
        const botMessage: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: botResponse,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        };

        session.messages.push(botMessage);
      }

      // Update session timestamp
      session.updatedAt = new Date();

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      
      // Add error message to session
      const errorMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };

      session.messages.push(errorMessage);
      session.updatedAt = new Date();
    } finally {
      setIsGenerating(false);
    }
  }, [options]);

  return {
    sendMessage,
    isGenerating,
    error,
    clearError
  };
}
