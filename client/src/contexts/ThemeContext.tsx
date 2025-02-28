import { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
  isAotMode: boolean;
  toggleAotMode: () => void;
  playThemeTransition: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isAotMode, setIsAotMode] = useState(() => {
    const savedMode = localStorage.getItem('aotMode');
    return savedMode === 'true';
  });

  const playThemeTransition = () => {
    const existingAudio = document.querySelector('audio[data-aot-audio]');
    if (existingAudio instanceof HTMLAudioElement) {
      existingAudio.pause();
      existingAudio.remove();
      return;
    }

    const button = document.querySelector('[aria-label="Toggle Theme"]');
    const audio = new Audio('/src/assets/audio/eren_scream.mp3');
    audio.setAttribute('data-aot-audio', 'true');
    const mainContent = document.querySelector('#root');
    
    mainContent?.classList.add('shake-container');
    button?.classList.add('shake-animation');
    document.body.classList.add('aot-theme-transition');
    
    audio.play();
    
    audio.onended = () => {
      setTimeout(() => {
        button?.classList.remove('shake-animation');
        mainContent?.classList.remove('shake-container');
        document.body.classList.add('aot-theme');
        setIsAotMode(true);
      }, 500);
    };
  };

  const toggleAotMode = () => {
    if (isAotMode) {
      setIsAotMode(false);
      localStorage.setItem('aotMode', 'false');
      document.body.classList.remove('aot-theme');
      return;
    }
    localStorage.setItem('aotMode', 'true');
    playThemeTransition();
  };

  return (
    <ThemeContext.Provider value={{ isAotMode, toggleAotMode, playThemeTransition }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};