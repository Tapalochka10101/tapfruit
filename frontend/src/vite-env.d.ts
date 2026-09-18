/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp?: {
      initData: string;
      initDataUnsafe: {
        start_param?: string;
        user?: {
          id: number;
          username?: string;
          first_name?: string;
        };
      };
      colorScheme: 'light' | 'dark';
      ready: () => void;
      expand: () => void;
      requestFullscreen?: () => void;
      disableVerticalSwipes?: () => void;
      setHeaderColor?: (color: string) => void;
    };
  };
}
