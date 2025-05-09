export interface AccessTokenStore extends AccessTokenStoreInput {
  ttl: number;
}

export interface AccessTokenStoreInput {
  accessToken: string;
  subjectId: string;
  claims: string[];
  sectorIdentifier: string;
  isNewAccount: boolean;
  passwordResetTime: number;
  hasBeenUsed: boolean;
}
