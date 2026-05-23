/** Server-only: import only from API routes and Server Components. */
import { ITickError } from "@/types/stock";

/** Free-tier tokens use api-free; paid tokens use api.itick.org */
const ITICK_BASE_DEFAULT = "https://api-free.itick.org";
const ITICK_BASE_PAID = "https://api.itick.org";

export interface ITickResponse<T> {
  code: number;
  msg: string | null;
  data: T;
}

export function getITickApiKey(): string | undefined {
  const key = process.env.ITICK_API_KEY?.trim();
  return key || undefined;
}

export function getITickBaseUrl(): string {
  const configured = process.env.ITICK_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return ITICK_BASE_DEFAULT;
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.msg === "string" && record.msg.trim()) return record.msg.trim();
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message.trim();
    }
  }
  return `HTTP ${status}`;
}

function authHint(status: number): string {
  if (status !== 401) return "";
  const base = getITickBaseUrl();
  if (base.includes("api-free")) {
    return " — check ITICK_API_KEY in .env (https://itick.org/dashboard)";
  }
  return (
    " — free-tier keys require ITICK_BASE_URL=https://api-free.itick.org in .env; " +
    "paid keys use https://api.itick.org"
  );
}

export async function iTickGet<T>(
  path: string,
  params: Record<string, string | number>
): Promise<T> {
  const apiKey = getITickApiKey();
  if (!apiKey) {
    throw new ITickError(-1, "ITICK_API_KEY is not configured");
  }

  const url = new URL(`${getITickBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: {
        accept: "application/json",
        token: apiKey,
      },
      cache: "no-store",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network request failed";
    throw new ITickError(-1, message);
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    if (!res.ok) {
      throw new ITickError(res.status, `HTTP ${res.status}${authHint(res.status)}`);
    }
    throw new ITickError(-1, "Invalid JSON response from iTick");
  }

  const envelope = body as ITickResponse<T>;
  if (!res.ok) {
    const msg = parseErrorMessage(body, res.status) + authHint(res.status);
    throw new ITickError(res.status, msg);
  }

  if (typeof envelope.code !== "number" || envelope.code !== 0) {
    const msg = envelope.msg?.trim() || parseErrorMessage(body, res.status) || "Unknown iTick error";
    console.error("[iTick]", msg);
    throw new ITickError(envelope.code ?? -1, msg);
  }

  return envelope.data;
}

export { ITICK_BASE_DEFAULT, ITICK_BASE_PAID };
