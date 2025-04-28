export interface AuthCodeStore extends AuthCodeStoreInput {
  ttl: number;
}

export interface AuthCodeStoreInput {
  authCode: string;
  subjectId: string;
  claims: string[];
  sectorIdentifier: string;
  isNewAccount: boolean;
  passwordResetTime: number;
  hasBeenUsed: boolean;
}
