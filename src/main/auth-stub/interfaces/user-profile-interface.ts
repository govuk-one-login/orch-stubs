export interface UserProfile {
  SubjectID: string;
  Email: string;
  EmailVerified: boolean;
  PhoneNumber: string;
  PhoneNumberVerified: boolean;
  Created: string;
  Updated: string;
  termsAndConditions: TermsAndConditions;
  PublicSubjectID: string;
  LegacySubjectID: string;
  salt: string;
  accountVerified: number;
  testUser: number;
}

interface TermsAndConditions {
  version: string;
  timeStamp: string;
}
