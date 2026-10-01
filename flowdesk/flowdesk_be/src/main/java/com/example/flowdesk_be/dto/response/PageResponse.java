package com.example.flowdesk_be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class PageResponse<T> {
  private List<T> items;
  private long total;
  private int limit;
  private int page;
  private int totalPages;

  public static <T> PageResponse<T> of(List<T> items, long total, int limit, int page) {
    return new PageResponse<>(items, total, limit, page, totalPages(total, limit));
  }

  public static <T> PageResponse<T> fromList(List<T> items, Integer limit, Integer page) {
    int safeLimit = Math.min(Math.max(limit == null ? 10 : limit, 1), 100);
    int safePage = Math.max(page == null ? 1 : page, 1);
    int startIndex = (safePage - 1) * safeLimit;
    int from = Math.min(startIndex, items.size());
    int to = Math.min(from + safeLimit, items.size());
    return of(items.subList(from, to), items.size(), safeLimit, safePage);
  }

  private static int totalPages(long total, int limit) {
    if (limit <= 0) {
      return 0;
    }
    return (int) Math.ceil((double) total / limit);
  }
}
