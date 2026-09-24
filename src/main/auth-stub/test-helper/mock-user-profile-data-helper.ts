import { UserProfile } from "../interfaces/user-profile-interface.ts";

export const createUserProfile = (
  email: string,
  subjectId: string
): UserProfile => {
  return {
    subject_id: subjectId,
    email: email,
    email_verified: true,
    phone_number: "12345678910",
    phone_number_verified: true,
    created: "2025-04-11T12:00:00",
    updated: "2025-04-11T12:00:00",
    terms_and_conditions: {
      version: "1.0",
      timeStamp: "2025-04-10T12:00:00",
    },
    public_subject_id: "public-subject-id",
    legacy_subject_id: "legacy-subject-id",
    local_account_id: subjectId,
    salt: "salt",
    account_verified: 1,
    test_user: 0,
    achieved_credentials_strength: "MEDIUM_LEVEL",
  };
};
