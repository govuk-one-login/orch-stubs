import { LogIds } from "./spot-request";

export interface SpotResponse {
  claims: Record<string, string>;
  sub: string;
  status: "ACCEPTED" | "REJECTED";
  reason: string;
  log_ids: LogIds;
}
