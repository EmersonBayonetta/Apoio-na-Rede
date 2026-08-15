import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilitySettings } from '../types';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  setFontSize: (size: 'sm' | 'md' | 'lg' | 'xl') => void;
  setHighContrast: (mode: 'default' | 'dark' | 'yellow-black') => void;
  toggleDyslexicFont: () => void;
  toggleReducedSensory: () => void;
  toggleVoiceReading: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  activeSpeechText: string;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'md',
  highContrast: 'default',
  dyslexicFont: false,
  reducedSensory: false,
  voiceReadingEnabled: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('acessacidade_accessibility_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechText, setActiveSpeechText] = useState('');

  // Persistir e aplicar classes globais no DOM
  useEffect(() => {
    localStorage.setItem('acessacidade_accessibility_settings', JSON.stringify(settings));

    // Escala de Fonte
    document.documentElement.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg', 'font-size-xl');
    document.documentElement.classList.add(`font-size-${settings.fontSize}`);

    // Alto Contraste
    document.body.classList.remove('theme-high-contrast-dark', 'theme-yellow-black');
    if (settings.highContrast === 'dark') {
      document.body.classList.add('theme-high-contrast-dark');
    } else if (settings.highContrast === 'yellow-black') {
      document.body.classList.add('theme-yellow-black');
    }

    // Fonte para Dislexia
    if (settings.dyslexicFont) {
      document.body.classList.add('font-dyslexic');
    } else {
      document.body.classList.remove('font-dyslexic');
    }

    // Redução Sensorial (Autismo / TDAH)
    if (settings.reducedSensory) {
      document.body.classList.add('reduced-sensory');
    } else {
      document.body.classList.remove('reduced-sensory');
    }
  }, [settings]);

  const setFontSize = (size: 'sm' | 'md' | 'lg' | 'xl') => {
    setSettings((prev) => ({ ...prev, fontSize: size }));
  };

  const setHighContrast = (mode: 'default' | 'dark' | 'yellow-black') => {
    setSettings((prev) => ({ ...prev, highContrast: mode }));
  };

  const toggleDyslexicFont = () => {
    setSettings((prev) => ({ ...prev, dyslexicFont: !prev.dyslexicFont }));
  };

  const toggleReducedSensory = () => {
    setSettings((prev) => ({ ...prev, reducedSensory: !prev.reducedSensory }));
  };

  const toggleVoiceReading = () => {
    setSettings((prev) => ({ ...prev, voiceReadingEnabled: !prev.voiceReadingEnabled }));
  };

  // Síntese de Voz (TTS)
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Seu navegador não suporta leitura em voz alta.');
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setActiveSpeechText(cleanText);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveSpeechText('');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveSpeechText('');
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveSpeechText('');
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        setFontSize,
        setHighContrast,
        toggleDyslexicFont,
        toggleReducedSensory,
        toggleVoiceReading,
        speakText,
        stopSpeaking,
        isSpeaking,
        activeSpeechText,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
