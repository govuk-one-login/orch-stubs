import { LogIds } from "./spot-request";

export interface SpotResponse {
  claims: { [key: string]: string };
  sub: string;
  status: "ACCEPTED" | "REJECTED";
  reason: string;
  log_ids: LogIds;
}
