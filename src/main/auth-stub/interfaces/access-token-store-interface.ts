export interface AccessTokenStore extends AccessTokenStoreInput {
  ttl: number;
}

export interface AccessTokenStoreInput {
  token: string;
  subjectId: string;
  claims: string[];
  sectorIdentifier: string;
  isNewAccount: boolean;
  passwordResetTime: number;
  hasBeenUsed: boolean;
}
