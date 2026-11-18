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

/**
 * Nhãn trạng thái offline: "Hoạt động 5 phút trước", "Hoạt động 2 giờ trước"...
 * Không có thông tin → "Ngoại tuyến".
 */
export function formatLastSeen(
  dateStr: string | null | undefined,
  now: number = Date.now(),
): string {
  if (!dateStr) return "Ngoại tuyến";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Ngoại tuyến";
  const diffMin = Math.floor((now - d.getTime()) / 60_000);
  if (diffMin < 1) return "Vừa mới hoạt động";
  if (diffMin < 60) return `Hoạt động ${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `Hoạt động ${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `Hoạt động ${diffDay} ngày trước`;
  return "Ngoại tuyến";
}
