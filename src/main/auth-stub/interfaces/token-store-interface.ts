export interface TokenStore extends TokenStoreInput {
  ttl: number;
}

export interface TokenStoreInput {
  token: string;
  subjectId: string;
  claims: string[];
  sectorIdentifier: string;
  isNewAccount: boolean;
  passwordResetTime: number;
  hasBeenUsed: boolean;
}
