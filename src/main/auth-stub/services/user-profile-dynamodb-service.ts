import { UserProfile } from "../interfaces/user-profile-interface";

export const DUMMY_EMAIL = "dummy.email@mail.com";
export const DUMMY_SUBJECT_ID = "dummy-subject-id";

const dummyUserProfile: UserProfile = {
  SubjectID: DUMMY_SUBJECT_ID,
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

export const getUserProfileByEmail = async (
  email: string
): Promise<UserProfile> => {
  // TODO: Implement the actual logic to get the user profile from DynamoDB
  // For now, we return a dummy user profile if the email matches the dummy email
  // and reject the promise if it doesn't match
  if (email !== DUMMY_EMAIL) {
    return Promise.reject(new Error("invalid email"));
  }
  return Promise.resolve(dummyUserProfile);
};

export const getUserProfileBySubjectId = async (
  subjectId: string
): Promise<UserProfile> => {
  // TODO: Implement the actual logic to get the user profile from DynamoDB
  // For now, we return a dummy user profile if the subject ID matches the dummy subject ID
  // and reject the promise if it doesn't match
  if (subjectId !== DUMMY_SUBJECT_ID) {
    return Promise.reject(new Error("invalid subject ID"));
  }
  return Promise.resolve(dummyUserProfile);
};
