export interface TokenStore {
  token: string;
  subjectId: string;
  claims: string[];
  sectorIdentifier: string;
  isNewAccount: boolean;
  passwordResetTime: number;
  ttl: number;
  hasBeenUsed: boolean;
}
