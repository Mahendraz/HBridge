import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6", 
      lg: "h-8 w-8",
    };

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        <svg 
          className={cn("animate-spin text-current", sizeClasses[size])} 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      </div>
    );
  }
);
LoadingSpinner.displayName = "LoadingSpinner";

interface LoadingPageProps {
  title?: string;
  description?: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({
  title = "Memuat...",
  description = "Harap tunggu sementara kami memuat konten Anda."
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="text-teal-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

interface LoadingOverlayProps {
  isVisible: boolean;
  title?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  title = "Memuat..."
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="md" className="text-teal-600" />
          <span className="text-gray-900 font-medium">{title}</span>
        </div>
      </div>
    </div>
  );
};

export { LoadingSpinner, LoadingPage, LoadingOverlay };