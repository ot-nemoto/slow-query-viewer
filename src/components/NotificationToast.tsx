"use client";

export interface ErrorNotification {
  id: string;
  type: "error" | "warning" | "success";
  title: string;
  message: string;
  timestamp: number;
}

interface NotificationToastProps {
  notification: ErrorNotification;
  onRemove: (id: string) => void;
}

export default function NotificationToast({
  notification,
  onRemove,
}: NotificationToastProps) {
  const typeStyles = {
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };

  const iconsByType = {
    error: (
      <svg
        className="w-5 h-5 text-red-400"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <title>エラー</title>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg
        className="w-5 h-5 text-yellow-400"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <title>警告</title>
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    success: (
      <svg
        className="w-5 h-5 text-green-400"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <title>成功</title>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <div
      className={`${typeStyles[notification.type]} border rounded-lg p-4 shadow-md transition-all duration-300 transform animate-in slide-in-from-right max-w-md`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{iconsByType[notification.type]}</div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{notification.title}</h3>
          <div className="mt-1 text-sm whitespace-pre-line">
            {notification.message}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            type="button"
            className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current"
            onClick={() => onRemove(notification.id)}
            aria-label="通知を閉じる"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <title>閉じる</title>
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
