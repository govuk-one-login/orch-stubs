import {
  getOrchToAuthExpectedClientId,
  getOrchToAuthExpectedAudience,
} from "./config.ts";
export const VALID_AUTH_USER_INFO_CLAIMS = Object.freeze([
  "legacy_subject_id",
  "public_subject_id",
  "local_account_id",
  "rp_pairwise_id",
  "email",
  "email_verified",
  "phone_number",
  "phone_number_verified",
  "salt",
  "verified_mfa_method_type",
  "new_account",
  "uplift_required",
  "achieved_credential_strength",
  "account_data_api_access_token",
] as const);
export type AuthUserInfoClaim = (typeof VALID_AUTH_USER_INFO_CLAIMS)[number];

export interface Claims {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  nbf: number;
  jti: string;
  client_name: string;
  cookie_consent_shared: boolean;
  is_one_login_service: boolean;
  service_type: string;
  govuk_signin_journey_id: string;
  state: string;
  client_id: string;
  redirect_uri: string;
  rp_client_id: string;
  rp_sector_host: string;
  rp_redirect_uri: string;
  rp_state: string;
  reauthenticate?: string;
  claim?: string;
  previous_session_id?: string;
  previous_govuk_signin_journey_id: string;
  channel?: string;
  authenticated: boolean;
  current_credential_strength?: string;
  cookie_consent?: string;
  _ga?: string;
  scope: string;
  requested_level_of_confidence?: string;
  requested_credential_strength: string;
  account_data_api_access_token?: string;
}

export const requiredClaimsKeys = [
  "iss",
  "aud",
  "exp",
  "iat",
  "nbf",
  "jti",
  "client_name",
  "cookie_consent_shared",
  "is_one_login_service",
  "service_type",
  "govuk_signin_journey_id",
  "state",
  "client_id",
  "redirect_uri",
  "rp_sector_host",
  "authenticated",
  "scope",
  "requested_credential_strength",
];

export const getKnownClaims = (): Record<string, string | boolean | number> => {
  return {
    client_id: getOrchToAuthExpectedClientId(),
    aud: getOrchToAuthExpectedAudience(),
  };
};
