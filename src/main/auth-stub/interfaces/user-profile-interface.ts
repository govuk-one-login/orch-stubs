export interface UserProfile {
  subjectID: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string;
  phoneNumberVerified: boolean;
  created: string;
  updated: string;
  termsAndConditions: TermsAndConditions;
  publicSubjectID: string;
  legacySubjectID: string;
  salt: string;
  accountVerified: number;
  testUser: number;
}

interface TermsAndConditions {
  version: string;
  timeStamp: string;
}
