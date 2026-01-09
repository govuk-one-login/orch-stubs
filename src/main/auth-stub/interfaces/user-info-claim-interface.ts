export interface UserInfoClaims {
  sub: string;
  rp_pairwise_id: string;
  new_account: boolean;
  password_reset_time: number;
  legacy_subject_id: string;
  public_subject_id: string;
  local_account_id: string;
  email: string;
  email_verified: boolean;
  phone_number: string;
  phone_number_verified: boolean;
  salt: string;
  verified_mfa_method_type: string;
  uplift_required: string;
  achieved_credential_strength: string;
}
