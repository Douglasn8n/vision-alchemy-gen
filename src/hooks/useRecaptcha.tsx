import { useEffect, useState } from 'react';

const RECAPTCHA_SITE_KEY = '6LeAsv4gAAAAAMr_e-H-RAdb_DlduxoHBDrZoOw_';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export const useRecaptcha = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if grecaptcha is already loaded
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => {
        setIsReady(true);
      });
    } else {
      // Wait for the script to load
      const checkRecaptcha = setInterval(() => {
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {
            setIsReady(true);
          });
          clearInterval(checkRecaptcha);
        }
      }, 100);

      return () => clearInterval(checkRecaptcha);
    }
  }, []);

  const executeRecaptcha = async (action: string): Promise<string | null> => {
    if (!isReady || !window.grecaptcha) {
      console.error('reCAPTCHA not ready');
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
      return token;
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error);
      return null;
    }
  };

  return {
    isReady,
    executeRecaptcha,
  };
};
