export interface SpotRequest {
  in_claims: { [key: string]: string };
  in_local_account_id: string;
  in_salt: string;
  in_rp_sector_id: string;
  out_sub: string;
  log_ids: LogIds;
  out_audience: string;
}

export interface LogIds {
  sessionId: string;
  persistentSessionId: string;
  requestId: string;
  clientId: string;
  clientSessionId: string;
}
