import { useEffect, useState } from "react";
import axiosInstance from "./axiosinstance";

export interface GeoInfo {
  region: string;
  city: string;
  isSouthIndia: boolean;
  isCorrectTime: boolean;
  theme: "light" | "dark";
}

const SOUTH_INDIA_STATES = new Set([
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
]);

const UNKNOWN_REGION = "Unknown";
const UNKNOWN_CITY = "Unknown city";

const normalizeRegion = (value = "") => value.trim() || UNKNOWN_REGION;
const normalizeCity = (value = "") => value.trim() || UNKNOWN_CITY;

const getStoredRegion = () => {
  if (typeof window === "undefined") return UNKNOWN_REGION;
  return normalizeRegion(localStorage.getItem("detected_region") || UNKNOWN_REGION);
};

const getStoredCity = () => {
  if (typeof window === "undefined") return UNKNOWN_CITY;
  return normalizeCity(localStorage.getItem("detected_city") || UNKNOWN_CITY);
};

export const isSouthIndiaRegion = (region = "") => SOUTH_INDIA_STATES.has(normalizeRegion(region));

const getBrowserGeoFallback = async () => {
  const response = await fetch("https://ipapi.co/json/", {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to detect browser geo");
  }

  const data = await response.json();
  const region = normalizeRegion(data?.region || UNKNOWN_REGION);
  const city = normalizeCity(data?.city || UNKNOWN_CITY);

  return {
    region,
    city,
    isSouthIndia: isSouthIndiaRegion(region),
  };
};

export const getThemeForContext = (
  region: string,
  date: Date = new Date()
): Pick<GeoInfo, "isCorrectTime" | "theme" | "isSouthIndia"> => {
  const isSouthIndia = isSouthIndiaRegion(region);
  const timeInIST = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hourValue = Number(timeInIST.find((part) => part.type === "hour")?.value || "0");
  const minuteValue = Number(timeInIST.find((part) => part.type === "minute")?.value || "0");
  const totalMinutes = hourValue * 60 + minuteValue;
  const isCorrectTime = totalMinutes >= 600 && totalMinutes < 720;

  return {
    isSouthIndia,
    isCorrectTime,
    theme: isSouthIndia && isCorrectTime ? "light" : "dark",
  };
};

export const useGeoTimeTheme = () => {
  const [geoInfo, setGeoInfo] = useState<GeoInfo>({
    region: "Unknown",
    city: UNKNOWN_CITY,
    isSouthIndia: false,
    isCorrectTime: false,
    theme: "dark",
  });

  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const response = await axiosInstance.get("/user/location-context");
        let region = normalizeRegion(response.data?.region || UNKNOWN_REGION);
        let city = normalizeCity(response.data?.city || UNKNOWN_CITY);
        let isSouthIndia = Boolean(response.data?.isSouthIndia);

        if (region === UNKNOWN_REGION) {
          try {
            const browserGeo = await getBrowserGeoFallback();
            region = browserGeo.region;
            city = browserGeo.city;
            isSouthIndia = browserGeo.isSouthIndia;
          } catch (fallbackError) {
            const storedRegion = getStoredRegion();
            const storedCity = getStoredCity();
            region = storedRegion;
            city = storedCity;
            isSouthIndia = isSouthIndiaRegion(storedRegion);
          }
        }

        const themeContext = getThemeForContext(region);
        isSouthIndia = themeContext.isSouthIndia;

        setGeoInfo({
          region,
          city,
          isSouthIndia,
          isCorrectTime: themeContext.isCorrectTime,
          theme: themeContext.theme,
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("detected_region", region);
          localStorage.setItem("detected_city", city);
        }

        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(themeContext.theme);
      } catch (error) {
        const storedRegion = getStoredRegion();
        const storedCity = getStoredCity();
        const themeContext = getThemeForContext(storedRegion);

        setGeoInfo({
          region: storedRegion,
          city: storedCity,
          isSouthIndia: themeContext.isSouthIndia,
          isCorrectTime: themeContext.isCorrectTime,
          theme: themeContext.theme,
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("detected_region", storedRegion);
          localStorage.setItem("detected_city", storedCity);
        }

        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(themeContext.theme);
      }
    };

    fetchGeo();
  }, []);

  return geoInfo;
};
