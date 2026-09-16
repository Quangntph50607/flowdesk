/**
 * Format thời gian cho sidebar + bubble chat.
 * - Vừa xong (< 1 phút)
 * - N phút trước
 * - HH:mm (hôm nay)
 * - dd/MM (năm nay, khác ngày)
 * - dd/MM/yy (năm khác)
 */
export function formatChatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  if (diffMs < 60_000) return "Vừa xong";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)} phút`;

  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (sameDay) {
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  }

  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export function formatMessageTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
