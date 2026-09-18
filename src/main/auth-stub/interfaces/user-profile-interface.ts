import { AuthUserInfoClaim } from "../helpers/claims-config";

export interface UserProfileClaims extends Partial<
  Record<AuthUserInfoClaim, string | boolean | number>
> {
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  phone_number_verified?: boolean;
  public_subject_id?: string;
  legacy_subject_id?: string;
  salt?: string;
  account_verified?: number;
}

export interface UserProfile extends UserProfileClaims {
  created: string;
  updated: string;
  terms_and_conditions: TermsAndConditions;
  test_user: number;
  subject_id: string;
  achieved_credentials_strength: string;
}

interface TermsAndConditions {
  version: string;
  timeStamp: string;
}
