import * as React from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "destructive" | "success";

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariant;
}

interface ToastContextValue {
  toasts: Array<{
    id: string;
    title?: string;
    description?: string;
    variant?: ToastVariant;
  }>;
  addToast: (toast: {
    title?: string;
    description?: string;
    variant?: ToastVariant;
  }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastContextValue['toasts']>([]);

  const addToast = React.useCallback((toast: Parameters<ToastContextValue['addToast']>[0]) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          onClose={() => toast.id}
        />
      ))}
    </div>
  );
};

const Toast = React.forwardRef<
  HTMLDivElement,
  ToastProps & {
    title?: string;
    description?: string;
    onClose?: () => void;
  }
>(({ className, variant = "default", title, description, onClose, ...props }, ref) => {
  const variantClasses = {
    default: "bg-white border-gray-200 text-gray-900",
    destructive: "bg-red-50 border-red-200 text-red-900",
    success: "bg-green-50 border-green-200 text-green-900",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-lg border p-4 shadow-lg",
        "min-w-[300px] max-w-[400px]",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      {title && (
        <div className="font-semibold text-sm mb-1">
          {title}
        </div>
      )}
      
      {description && (
        <div className="text-sm opacity-90">
          {description}
        </div>
      )}
    </div>
  );
});
Toast.displayName = "Toast";

export { Toast };