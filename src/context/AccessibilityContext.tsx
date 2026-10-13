import { browserStorage, readStoredArray } from '../lib/browserStorage';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AccessibilitySettings, DisabilityType } from '../types';
import { parseRequirementProfile, type RequirementProfile } from '../utils/needsCompatibility';

const SETTINGS_KEY = 'acessacidade_accessibility_settings';
const PREFERENCES_KEY = 'apoio_accessibility_preferences_v1';
const REQUIREMENTS_KEY = 'apoio_requirements_v1';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  accessibilityPreferences: DisabilityType[];
  requirements: RequirementProfile;
  applySettings: (settings: Partial<AccessibilitySettings>) => void;
  setAccessibilityPreferences: (preferences: DisabilityType[]) => void;
  setRequirements: (requirements: RequirementProfile) => void;
  setFontSize: (size: 'sm' | 'md' | 'lg' | 'xl') => void;
  setHighContrast: (mode: 'default' | 'dark' | 'yellow-black') => void;
  toggleDyslexicFont: () => void;
  toggleReducedSensory: () => void;
  toggleVoiceReading: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  activeSpeechText: string;
  speechError: string;
  dismissSpeechError: () => void;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'md',
  highContrast: 'default',
  dyslexicFont: false,
  reducedSensory: false,
  voiceReadingEnabled: false,
  enhancedFocus: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = browserStorage.getItem(SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [accessibilityPreferences, setAccessibilityPreferencesState] = useState<DisabilityType[]>(() => {
    try {
      return readStoredArray<DisabilityType>(PREFERENCES_KEY).filter(type => ['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel'].includes(type));
    } catch {
      return [];
    }
  });
  const [requirements, setRequirementsState] = useState<RequirementProfile>(() => parseRequirementProfile(browserStorage.getItem(REQUIREMENTS_KEY)));

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechText, setActiveSpeechText] = useState('');
  const [speechError, setSpeechError] = useState('');
  const speechStartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearSpeechStartTimer = () => {if (speechStartTimer.current !== null) clearTimeout(speechStartTimer.current);speechStartTimer.current = null;};
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Persistir e aplicar classes globais no DOM
  useEffect(() => {
    browserStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

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

    document.body.classList.toggle('enhanced-focus', settings.enhancedFocus);
  }, [settings]);

  const setAccessibilityPreferences = (preferences: DisabilityType[]) => {
    setAccessibilityPreferencesState(preferences);
    browserStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  };

  const setRequirements = (next: RequirementProfile) => {
    setRequirementsState(next);
    browserStorage.setItem(REQUIREMENTS_KEY, JSON.stringify(next));
  };

  const setFontSize = (size: 'sm' | 'md' | 'lg' | 'xl') => {
    setSettings((prev) => ({ ...prev, fontSize: size }));
  };

  const applySettings = (nextSettings: Partial<AccessibilitySettings>) => {
    setSettings((previous) => ({ ...previous, ...nextSettings }));
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
    if (!settings.voiceReadingEnabled) return;
    setSpeechError('');
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setSpeechError('Este navegador não oferece leitura em voz alta. Tente outro navegador.');
      return;
    }

    stopSpeaking();
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) {
      setSpeechError('Não há texto disponível para leitura nesta página.');
      return;
    }

    // Keep each native speech request short, without losing any page text.
    const chunks: string[] = [];
    let remaining = cleanText.replace(/\s+/g, ' ');
    while (remaining.length > 220) {
      const candidate = remaining.slice(0, 221);
      const sentence = [...candidate.matchAll(/[.!?;:]\s/g)].at(-1)?.index;
      const boundary = sentence !== undefined && sentence >= 60 ? sentence + 1 : candidate.lastIndexOf(' ');
      const end = boundary > 0 ? boundary : 220;
      chunks.push(remaining.slice(0, end));
      remaining = remaining.slice(end).trimStart();
    }
    if (remaining) chunks.push(remaining);
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    const portuguese = voices.filter(item => item.lang.toLowerCase().replace('_', '-').startsWith('pt'));
    const voice = portuguese.find(item => item.localService && item.lang.toLowerCase().replace('_', '-') === 'pt-br')
      ?? portuguese.find(item => item.lang.toLowerCase().replace('_', '-') === 'pt-br')
      ?? portuguese[0];
    setIsSpeaking(true);
    setActiveSpeechText(cleanText);

    const readChunk = (index: number) => {
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.lang = 'pt-BR';
      utterance.rate = 1;
      if (voice) utterance.voice = voice;
      utteranceRef.current = utterance;
      clearSpeechStartTimer();
      speechStartTimer.current = setTimeout(() => {
        if (utteranceRef.current !== utterance || synth.speaking) return;
        stopSpeaking();
        setSpeechError('A leitura não iniciou. Verifique se há uma voz em português disponível no celular e toque em Ouvir novamente.');
      }, 8000);
      utterance.onstart = () => {if (utteranceRef.current === utterance) clearSpeechStartTimer();};
      utterance.onend = () => {
        if (utteranceRef.current !== utterance) return;
        clearSpeechStartTimer();
        if (index + 1 < chunks.length) readChunk(index + 1);
        else {
          utteranceRef.current = null;
          setIsSpeaking(false);
          setActiveSpeechText('');
        }
      };
      utterance.onerror = (event) => {
        if (utteranceRef.current !== utterance) return;
        clearSpeechStartTimer();
        utteranceRef.current = null;
        setIsSpeaking(false);
        setActiveSpeechText('');
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          setSpeechError('Não foi possível reproduzir a leitura. Verifique a voz em português nas configurações do dispositivo e tente novamente.');
        }
      };
      try {
        // The first speak stays inside the user's tap, including on iOS.
        if (synth.paused) synth.resume();
        synth.speak(utterance);
      } catch {
        stopSpeaking();
        setSpeechError('Não foi possível iniciar a leitura neste navegador. Tente novamente.');
      }
    };
    readChunk(0);
  };

  const stopSpeaking = () => {
    clearSpeechStartTimer();
    utteranceRef.current = null;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveSpeechText('');
    }
  };

  useEffect(() => {
    if (!settings.voiceReadingEnabled) stopSpeaking();
    return () => {
      clearSpeechStartTimer();
      utteranceRef.current = null;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [settings.voiceReadingEnabled]);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        accessibilityPreferences,
        requirements,
        applySettings,
        setAccessibilityPreferences,
        setRequirements,
        setFontSize,
        setHighContrast,
        toggleDyslexicFont,
        toggleReducedSensory,
        toggleVoiceReading,
        speakText,
        stopSpeaking,
        isSpeaking,
        activeSpeechText,
        speechError,
        dismissSpeechError: () => setSpeechError(''),
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
