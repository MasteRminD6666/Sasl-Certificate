import { Alert } from "react-native";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    Alert.alert("useNotification must be used within a notification provider");
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    let isMounted = true;

    // Try to register for push notifications, but don't crash if Firebase isn't set up
    const registerPushNotification = async () => {
      try {
        const { registerForPushNotificationsAsync } = require("@/utils/registerForPushNotificationsAsync");
        const token = await registerForPushNotificationsAsync();
        if (isMounted && token) {
          setExpoPushToken(token);
        }
      } catch (err: any) {
        // Firebase/Push not configured — silently ignore
        if (isMounted) setError(err);
      }
    };
    registerPushNotification();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        if (response.notification.request.content.data.courseData) {
          router.push({
            pathname: "/(routes)/course-access",
            params: {
              ...response.notification.request.content.data.courseData,
              activeVideo:
                response.notification.request.content.data.activeVideo,
            },
          });
        }
        if (response.notification.request.content.data.link) {
          router.push(response.notification.request.content.data.link);
        }
      });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response?.notification) {
        return;
      }
    });

    return () => {
      isMounted = false;
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, error }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
