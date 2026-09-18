import {
  UserProfile,
  UserProfileClaims,
} from "../interfaces/user-profile-interface.ts";

const MOCK_SUBJECT_ID = "123456";
const MOCK_EMAIL_VERIFIED = true;
const MOCK_PHONE_NUMBER = "07123098567";
const MOCK_PHONE_NUMBER_VERIFIED = true;
const MOCK_CREATED = "2025-04-11T12:00:00";
const MOCK_UPDATED = "2025-04-11T12:00:00";
const MOCK_TERMS_AND_CONDITIONS = {
  version: "1.0",
  timeStamp: "2025-04-10T12:00:00",
};
const MOCK_PUBLIC_SUBJECT_ID = "public-subject-id";
const MOCK_LEGACY_SUBJECT_ID = "legacy-subject-id";
const MOCK_SALT = "salt";
const MOCK_ACCOUNT_VERIFIED = 1;
const MOCK_TEST_USER = 0;
const MOCK_EMAIL = "dummy.email@mail.com";
const MOCK_ACHIEVED_CREDENTIAL_STRENGTH = "MEDIUM_LEVEL";

export const DEFAULT_CLAIMS: UserProfileClaims = {
  email: MOCK_EMAIL,
  email_verified: MOCK_EMAIL_VERIFIED,
  phone_number: MOCK_PHONE_NUMBER,
  phone_number_verified: MOCK_PHONE_NUMBER_VERIFIED,
  public_subject_id: MOCK_PUBLIC_SUBJECT_ID,
  legacy_subject_id: MOCK_LEGACY_SUBJECT_ID,
  local_account_id: MOCK_SUBJECT_ID,
  salt: MOCK_SALT,
  account_verified: MOCK_ACCOUNT_VERIFIED,
};

export const createUserProfile = (claims: UserProfileClaims): UserProfile => {
  const userProfile: UserProfile = {
    subject_id: MOCK_SUBJECT_ID,
    created: MOCK_CREATED,
    updated: MOCK_UPDATED,
    terms_and_conditions: MOCK_TERMS_AND_CONDITIONS,
    test_user: MOCK_TEST_USER,
    achieved_credentials_strength: MOCK_ACHIEVED_CREDENTIAL_STRENGTH,
    ...claims,
  };
  return userProfile;
};
