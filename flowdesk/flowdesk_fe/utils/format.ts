/**
 * Format date sang dạng dd/MM/yyyy HH:mm
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

/**
 * Lấy chữ cái đầu để hiển thị Avatar
 */
export function getInitial(name?: string): string {
  return name?.charAt(0).toUpperCase() ?? "U";
}

/**
 * Truncate text nếu quá dài
 */
export function truncate(text: string, maxLength = 50): string {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}
