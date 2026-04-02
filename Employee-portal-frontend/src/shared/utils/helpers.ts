/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(date);
};

/**
 * Truncate text
 */
export const truncateText = (text: string, length: number): string => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

/**
 * Highlight search text
 */
export const highlightText = (text: string, query: string): string => {
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get initials from name
 */
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};
