import { useState, useEffect } from 'react';

export interface GeoInfo {
  region: string;
  isSouthIndia: boolean;
  isCorrectTime: boolean;
  theme: 'light' | 'dark';
}

export const useGeoTimeTheme = () => {
  const [geoInfo, setGeoInfo] = useState<GeoInfo>({
    region: 'Unknown',
    isSouthIndia: false,
    isCorrectTime: false,
    theme: 'dark'
  });

  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const region = data.region || 'Unknown';
        
        const southIndiaStates = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];
        const isSouthIndia = southIndiaStates.includes(region);

        // Check IST Time (10:00 AM - 12:00 PM)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
        const hours = istTime.getHours();
        const isCorrectTime = hours >= 10 && hours < 12;

        const theme = (isSouthIndia && isCorrectTime) ? 'light' : 'dark';

        setGeoInfo({
          region,
          isSouthIndia,
          isCorrectTime,
          theme
        });

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
          region: 'Karnataka',
          isSouthIndia: true,
          isCorrectTime: true,
          theme: 'dark' // Keep it safe
        });
      }
    };

    fetchGeo();
  }, []);

  return geoInfo;
};
