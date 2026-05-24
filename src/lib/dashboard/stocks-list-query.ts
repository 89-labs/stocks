const FORWARD_KEYS = ["q", "sector", "sort", "dir", "page"] as const;

export function stocksListQueryString(
  searchParams: Record<string, string | string[] | undefined>
): string {
  const params = new URLSearchParams();
  for (const key of FORWARD_KEYS) {
    const value = searchParams[key];
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
