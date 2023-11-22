
    import React, { createContext, useContext, useState, useEffect } from 'react';

    type MessageType = 'success' | 'warning' | 'error';
    
    interface Message {
      id: number;
      message: string;
      type: MessageType;
    }
    
    interface MessageContextData {
      messages: Message[];
      customSuccess: (message: string) => void;
      customAlert: (message: string) => void;
      customError: (message: string) => void;
    }
    
    const MessageContext = createContext<MessageContextData | undefined>(undefined);
    
    interface MessageProviderProps {
        children: React.ReactNode;
      }
      
    export const MessageProvider = ({ children }: MessageProviderProps): JSX.Element => {
      const [messages, setMessages] = useState<Message[]>([]);
      const [counter, setCounter] = useState(0);
    
      const addMessage = (message: string, type: MessageType) => {
        const newMessage = { id: counter, message, type };
        setMessages([...messages, newMessage]);
        setCounter(counter + 1);
    
        setTimeout(() => {
          setMessages((prevMessages) => prevMessages.filter((m) => m.id !== newMessage.id));
        }, 5000);
      };
    
      const customSuccess = (message: string) => addMessage(message, 'success');
      const customAlert = (message: string) => addMessage(message, 'warning');
      const customError = (message: string) => addMessage(message, 'error');
    
      return (
        <MessageContext.Provider value={{ messages, customSuccess, customAlert, customError }}>
          {children}
        </MessageContext.Provider>
      );
    };
    
    export const useMessage = (): MessageContextData => {
      const context = useContext(MessageContext);
      if (!context) {
        throw new Error('useMessage must be used within a MessageProvider');
      }
      return context;
    };
    