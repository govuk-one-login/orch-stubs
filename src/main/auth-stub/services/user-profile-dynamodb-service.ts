import { UserProfile } from "../interfaces/user-profile-interface";

export const DUMMY_EMAIL = "dummy.email@mail.com";

export const getUserProfile = async (email: string): Promise<UserProfile> => {
  // TODO: Implement the actual logic to get the user profile from DynamoDB
  // For now, we return a dummy user profile if the email matches the dummy email
  // and reject the promise if it doesn't match
  if (email !== DUMMY_EMAIL) {
    return Promise.reject(new Error("invalid email"));
  }

  const dummyUserProfile: UserProfile = {
    SubjectID: "dummy-subject-id",
    Email: DUMMY_EMAIL,
    EmailVerified: true,
    PhoneNumber: "12345678910",
    PhoneNumberVerified: true,
    Created: "2025-04-11T12:00:00",
    Updated: "2025-04-11T12:00:00",
    termsAndConditions: {
      version: "1.0",
      timeStamp: "2025-04-10T12:00:00",
    },
    PublicSubjectID: "public-subject-id",
    LegacySubjectID: "legacy-subject-id",
    salt: "salt",
    accountVerified: 1,
    testUser: 0,
  };
  return Promise.resolve(dummyUserProfile);
};
