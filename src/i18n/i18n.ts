import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ar from './locales/ar.json';

const resources = {
  en: {
    translation: en
  },
  ar: {
    translation: ar
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

// Update document direction and lang attribute when language changes
i18n.on('languageChanged', (lng) => {
  const direction = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = lng;
  document.body.dir = direction;
  document.body.lang = lng;
  
  // Add direction class to html element
  document.documentElement.className = direction;
  
  // Add font class for Arabic
  if (lng === 'ar') {
    document.body.classList.add('font-arabic');
  } else {
    document.body.classList.remove('font-arabic');
  }
  
  // Force layout recalculation
  document.body.style.display = 'none';
  document.body.offsetHeight; // Trigger reflow
  document.body.style.display = '';
});

// Set initial direction based on current language
const currentLang = i18n.language || 'en';
const initialDirection = currentLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.dir = initialDirection;
document.documentElement.lang = currentLang;
document.body.dir = initialDirection;
document.body.lang = currentLang;
document.documentElement.className = initialDirection;

// Add font class for Arabic
if (currentLang === 'ar') {
  document.body.classList.add('font-arabic');
}

export default i18n;