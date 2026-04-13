const SOUTH_INDIA_STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];
const geoCache = new Map();
const GEO_CACHE_TTL_MS = 10 * 60 * 1000;

const normalizeState = (value = "") => value.trim();

const getCachedGeo = (ip) => {
  const cachedEntry = geoCache.get(ip);
  if (!cachedEntry) return null;
  if (cachedEntry.expiresAt < Date.now()) {
    geoCache.delete(ip);
    return null;
  }
  return cachedEntry.value;
};

const setCachedGeo = (ip, value) => {
  geoCache.set(ip, {
    value,
    expiresAt: Date.now() + GEO_CACHE_TTL_MS,
  });
};

const getRequestIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }

  return req.socket?.remoteAddress || "";
};

const isPrivateOrLocalIp = (ip = "") => {
  const normalizedIp = ip.replace(/^::ffff:/, "").trim().toLowerCase();
  const octets = normalizedIp.split(".");
  const secondOctet = Number(octets[1] || "-1");
  const is172PrivateRange =
    octets.length === 4 &&
    octets[0] === "172" &&
    Number.isFinite(secondOctet) &&
    secondOctet >= 16 &&
    secondOctet <= 31;

  return (
    !normalizedIp ||
    normalizedIp === "::1" ||
    normalizedIp === "127.0.0.1" ||
    normalizedIp === "localhost" ||
    normalizedIp.startsWith("10.") ||
    normalizedIp.startsWith("192.168.") ||
    is172PrivateRange ||
    normalizedIp.startsWith("fc") ||
    normalizedIp.startsWith("fd")
  );
};

export const isSouthIndiaState = (state = "") => SOUTH_INDIA_STATES.includes(normalizeState(state));

export const getOtpChannelForState = (state = "") => (isSouthIndiaState(state) ? "email" : "mobile");

export const resolveRequestGeo = async (req) => {
  const requestIp = getRequestIp(req);
  const fallbackState = normalizeState(req.body?.state || req.query?.state || "");
  const fallbackGeo = {
    ip: requestIp || "unknown",
    region: fallbackState || "Unknown",
    isSouthIndia: isSouthIndiaState(fallbackState),
  };

  if (!requestIp || isPrivateOrLocalIp(requestIp)) {
    return fallbackGeo;
  }

  const cachedGeo = getCachedGeo(requestIp);
  if (cachedGeo) {
    return cachedGeo;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(requestIp)}/json/`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return fallbackGeo;
    }

    const data = await response.json();
    const region = normalizeState(data?.region || fallbackState || "Unknown");
    const resolvedGeo = {
      ip: requestIp,
      region: region || "Unknown",
      isSouthIndia: isSouthIndiaState(region),
    };

    setCachedGeo(requestIp, resolvedGeo);
    return resolvedGeo;
  } catch (error) {
    return fallbackGeo;
  }
};
