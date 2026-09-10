import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatPercentage(num: number, decimals: number = 1): string {
  return `${num.toFixed(decimals)}%`;
}

export function formatDate(dateStr: string, pattern: string = "MMM dd, yyyy"): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return "Invalid date";
  return format(date, pattern);
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, "MMM dd, yyyy HH:mm");
}

export function formatRelativeTime(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return "Invalid date";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatPolicyNumber(num: string): string {
  const clean = num.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const parts = clean.match(/.{1,4}/g) || [];
  return parts.join("-");
}

export function formatClaimNumber(num: string): string {
  const clean = num.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (clean.length <= 4) return clean;
  return `CLM-${clean.slice(0, 4)}-${clean.slice(4)}`;
}

export function formatSSN(ssn: string): string {
  const clean = ssn.replace(/\D/g, "");
  if (clean.length !== 4) return "****";
  return `***-**-${clean}`;
}

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 10) {
    return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  if (clean.length === 11 && clean[0] === "1") {
    return `+1 (${clean.slice(1, 4)}) ${clean.slice(4, 7)}-${clean.slice(7)}`;
  }
  return phone;
}

export function formatAddress(address: {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}): string {
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function capitalizeFirst(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => capitalizeFirst(word))
    .join(" ");
}

export function formatCurrencyAbbreviated(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function generateAvatarColor(name: string): string {
  const colors = [
    "#1d6bd8", "#0d9488", "#ef4444", "#f59e0b",
    "#22c55e", "#8b5cf6", "#ec4899", "#06b6d4",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
