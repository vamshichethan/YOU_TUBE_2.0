import { useEffect, useState } from "react";
import axiosInstance from "./axiosinstance";

export interface GeoInfo {
  region: string;
  isSouthIndia: boolean;
  isCorrectTime: boolean;
  theme: "light" | "dark";
}

const getAutoTheme = (isSouthIndia: boolean): Pick<GeoInfo, "isCorrectTime" | "theme"> => {
  const timeInIST = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hourValue = Number(timeInIST.find((part) => part.type === "hour")?.value || "0");
  const minuteValue = Number(timeInIST.find((part) => part.type === "minute")?.value || "0");
  const totalMinutes = hourValue * 60 + minuteValue;
  const isCorrectTime = totalMinutes >= 600 && totalMinutes < 720;

  return {
    isCorrectTime,
    theme: isSouthIndia && isCorrectTime ? "light" : "dark",
  };
};

export const useGeoTimeTheme = () => {
  const [geoInfo, setGeoInfo] = useState<GeoInfo>({
    region: "Unknown",
    isSouthIndia: false,
    isCorrectTime: false,
    theme: "dark",
  });

  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const response = await axiosInstance.get("/user/location-context");
        const region = response.data?.region || "Unknown";
        const isSouthIndia = Boolean(response.data?.isSouthIndia);
        const { isCorrectTime, theme } = getAutoTheme(isSouthIndia);

        setGeoInfo({
          region,
          isSouthIndia,
          isCorrectTime,
          theme,
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("detected_region", region);
        }

        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
      } catch (error) {
        const { isCorrectTime, theme } = getAutoTheme(false);

        setGeoInfo({
          region: "Unknown",
          isSouthIndia: false,
          isCorrectTime,
          theme,
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("detected_region", "Unknown");
        }

        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
      }
    };

    fetchGeo();
  }, []);

  return geoInfo;
};
