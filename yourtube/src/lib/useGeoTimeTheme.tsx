import { useState, useEffect } from 'react';

const SOUTH_INDIA_STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];
const THEME_STORAGE_KEY = "theme_preference";

export interface GeoInfo {
  region: string;
  isSouthIndia: boolean;
  isCorrectTime: boolean;
  theme: 'light' | 'dark';
  themePreference: 'auto' | 'light' | 'dark';
  setThemePreference: (value: 'auto' | 'light' | 'dark') => void;
}

export const useGeoTimeTheme = () => {
  const [geoInfo, setGeoInfo] = useState<GeoInfo>({
    region: 'Unknown',
    isSouthIndia: false,
    isCorrectTime: false,
    theme: 'dark',
    themePreference: 'auto',
    setThemePreference: () => {},
  });

  useEffect(() => {
    const fetchGeo = async () => {
      const savedPreference =
        typeof window !== "undefined"
          ? (localStorage.getItem(THEME_STORAGE_KEY) as 'auto' | 'light' | 'dark' | null)
          : null;

      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const region = data.region || 'Unknown';
        const isSouthIndia = SOUTH_INDIA_STATES.includes(region);

        const timeInIST = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).formatToParts(new Date());

        const hourValue = Number(timeInIST.find((part) => part.type === 'hour')?.value || '0');
        const minuteValue = Number(timeInIST.find((part) => part.type === 'minute')?.value || '0');
        const totalMinutes = (hourValue * 60) + minuteValue;
        const isCorrectTime = totalMinutes >= 600 && totalMinutes < 720;

        const autoTheme = (isSouthIndia && isCorrectTime) ? 'light' : 'dark';
        const theme = savedPreference && savedPreference !== 'auto' ? savedPreference : autoTheme;

        setGeoInfo({
          region,
          isSouthIndia,
          isCorrectTime,
          theme,
          themePreference: savedPreference || 'auto',
          setThemePreference: (value) => {
            const appliedTheme = value === 'auto' ? autoTheme : value;
            localStorage.setItem(THEME_STORAGE_KEY, value);
            setGeoInfo((prev) => ({
              ...prev,
              themePreference: value,
              theme: appliedTheme,
            }));

            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(appliedTheme);
          },
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('detected_region', region);
        }

        // Apply theme to document
        if (theme === 'light') {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
        }
      } catch (error) {
        console.warn("Geo sensing failed (likely blocked), using defaults.");
        setGeoInfo({
          region: 'Unknown',
          isSouthIndia: false,
          isCorrectTime: false,
          theme: savedPreference && savedPreference !== 'auto' ? savedPreference : 'dark',
          themePreference: savedPreference || 'auto',
          setThemePreference: (value) => {
            const appliedTheme = value === 'auto' ? 'dark' : value;
            localStorage.setItem(THEME_STORAGE_KEY, value);
            setGeoInfo((prev) => ({
              ...prev,
              themePreference: value,
              theme: appliedTheme,
            }));

            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(appliedTheme);
          },
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('detected_region', 'Unknown');
        }
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(savedPreference && savedPreference !== 'auto' ? savedPreference : 'dark');
      }
    };

    fetchGeo();
  }, []);

  return geoInfo;
};
