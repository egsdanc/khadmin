import { useLanguage } from '../contexts/LanguageContext';

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <div className="flex items-center gap-3">
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value as 'tr' | 'en')}
        className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
      >
        <option value="tr">🇹🇷 Türkçe</option>
        <option value="en">🇺🇸 English</option>
      </select>
    </div>
  );
}
