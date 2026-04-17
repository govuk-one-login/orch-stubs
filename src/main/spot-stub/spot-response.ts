import { LogIds } from "./spot-request.ts";

export interface SpotResponse {
  claims: Record<string, string>;
  sub: string;
  status: "ACCEPTED" | "REJECTED";
  reason: string;
  log_ids: LogIds;
}
