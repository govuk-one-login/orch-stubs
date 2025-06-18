export interface UserProfile {
  subjectId: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string;
  phoneNumberVerified: boolean;
  created: string;
  updated: string;
  termsAndConditions: TermsAndConditions;
  publicSubjectId: string;
  legacySubjectId: string;
  salt: string;
  accountVerified: number;
  testUser: number;
}

interface TermsAndConditions {
  version: string;
  timeStamp: string;
}
