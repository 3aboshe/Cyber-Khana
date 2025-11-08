import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  setFontSize: (size: 'small' | 'medium' | 'large' | 'xlarge') => void;
  highContrast: boolean;
  setHighContrast: (contrast: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (motion: boolean) => void;
  announcements: string[];
  announce: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      const settings = JSON.parse(saved);
      setFontSize(settings.fontSize || 'medium');
      setHighContrast(settings.highContrast || false);
      setReducedMotion(settings.reducedMotion || false);
    }

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setReducedMotion(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify({
      fontSize,
      highContrast,
      reducedMotion,
    }));

    // Apply font size to document
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px',
    };
    document.documentElement.style.fontSize = fontSizeMap[fontSize];

    // Apply high contrast
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [fontSize, highContrast, reducedMotion]);

  const announce = (message: string) => {
    setAnnouncements((prev) => [...prev, message]);
    // Clear announcement after screen reader has time to read it
    setTimeout(() => {
      setAnnouncements((prev) => prev.filter((a) => a !== message));
    }, 1000);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        reducedMotion,
        setReducedMotion,
        announcements,
        announce,
      }}
    >
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
