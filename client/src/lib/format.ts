const IST = "Asia/Kolkata";

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: IST,
  });

export const formatDateTime = (iso: string) =>
  `${new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: IST,
  })} · ${formatTime(iso)} IST`;

export const relativeTime = (iso: string) => {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
};

export const untilTime = (iso: string) => {
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (diffMin <= 0) return "expired";
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  return h < 48 ? `${h} h` : `${Math.floor(h / 24)} d`;
};

export const compactNumber = (n: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const pct = (n: number) => `${Math.round(n * 100)}%`;
