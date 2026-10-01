export interface PageResponse<T> {
  items: T[];
  total: number;
  limit: number;
  page: number;
  totalPages: number;
}

export function getPageItems<T>(data: T[] | PageResponse<T> | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.items ?? [];
}

export function getPageTotal<T>(data: T[] | PageResponse<T> | null | undefined): number {
  if (!data) return 0;
  return Array.isArray(data) ? data.length : data.total ?? data.items?.length ?? 0;
}
