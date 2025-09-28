"use client";

import NotificationToast, { type ErrorNotification } from "./NotificationToast";

interface NotificationContainerProps {
  notifications: ErrorNotification[];
  onRemove: (id: string) => void;
}

export default function NotificationContainer({
  notifications,
  onRemove,
}: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <section
      className="fixed top-4 right-4 z-[9999] space-y-3"
      aria-label="通知"
    >
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </section>
  );
}
