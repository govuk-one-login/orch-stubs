import { UserProfile } from "../interfaces/user-profile-interface.ts";

export const createUserProfile = (
  email: string,
  subjectId: string
): UserProfile => {
  return {
    subjectId: subjectId,
    email: email,
    emailVerified: true,
    phoneNumber: "12345678910",
    phoneNumberVerified: true,
    created: "2025-04-11T12:00:00",
    updated: "2025-04-11T12:00:00",
    termsAndConditions: {
      version: "1.0",
      timeStamp: "2025-04-10T12:00:00",
    },
    publicSubjectId: "public-subject-id",
    legacySubjectId: "legacy-subject-id",
    salt: "salt",
    accountVerified: 1,
    testUser: 0,
  };
};
