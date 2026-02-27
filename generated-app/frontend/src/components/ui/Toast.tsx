import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastMessage['type'], message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastState: { messages: ToastMessage[]; setMessages: React.Dispatch<React.SetStateAction<ToastMessage[]>> } | null = null;

export function showToast(type: ToastMessage['type'], message: string) {
  if (toastState) {
    const id = Math.random().toString(36).slice(2);
    toastState.setMessages(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      toastState?.setMessages(prev => prev.filter(m => m.id !== id));
    }, 4000);
  }
}

export function Toast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  toastState = { messages, setMessages };

  const icons = {
    success: <CheckCircle size={18} className="text-[#40916C]" />,
    error: <AlertCircle size={18} className="text-[#BC6C25]" />,
    info: <Info size={18} className="text-[#2196F3]" />,
  };

  return (
    <div className="fixed top-16 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {messages.map(msg => (
        <div
          key={msg.id}
          className="bg-white dark:bg-[#242B3D] border border-[#E5E1DB] dark:border-[#3D4556] rounded-lg shadow-lg p-3 flex items-center gap-3 animate-slide-in text-sm"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
          {icons[msg.type]}
          <span className="flex-1 text-[#2D3748] dark:text-[#E8ECF4]">{msg.message}</span>
          <button
            onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
            className="text-[#8896A6] hover:text-[#2D3748] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
