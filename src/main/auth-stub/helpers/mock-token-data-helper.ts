import { UserProfile } from "../interfaces/user-profile-interface.ts";

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

export const createUserPofile = (email: string): UserProfile => {
  return {
    subjectId: MOCK_SUBJECT_ID,
    email: email,
    emailVerified: MOCK_EMAIL_VERIFIED,
    phoneNumber: MOCK_PHONE_NUMBER,
    phoneNumberVerified: MOCK_PHONE_NUMBER_VERIFIED,
    created: MOCK_CREATED,
    updated: MOCK_UPDATED,
    termsAndConditions: MOCK_TERMS_AND_CONDITIONS,
    publicSubjectId: MOCK_PUBLIC_SUBJECT_ID,
    legacySubjectId: MOCK_LEGACY_SUBJECT_ID,
    salt: MOCK_SALT,
    accountVerified: MOCK_ACCOUNT_VERIFIED,
    testUser: MOCK_TEST_USER,
  };
};
