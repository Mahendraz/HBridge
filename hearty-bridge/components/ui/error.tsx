"use client";

import * as React from "react";
import { AlertTriangleIcon, RefreshCwIcon, XCircleIcon } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          title="Terjadi Kesalahan"
          description="Terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman."
          action={{
            label: "Muat Ulang Halaman",
            onClick: () => window.location.reload(),
          }}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorPageProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "page" | "inline";
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  title = "Kesalahan",
  description = "Terjadi kesalahan",
  action,
  variant = "page"
}) => {
  if (variant === "inline") {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-red-800">
            <XCircleIcon className="h-5 w-5 mr-2" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">{description}</p>
          {action && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={action.onClick}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <AlertTriangleIcon className="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{description}</p>
        {action && (
          <Button onClick={action.onClick}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
};

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3 flex-1">
          <div className="text-sm text-red-800 whitespace-pre-line">{message}</div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                onClick={onDismiss}
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { ErrorBoundary, ErrorPage, ErrorAlert };