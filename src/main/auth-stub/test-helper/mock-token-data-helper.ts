import {
  AccessTokenStore,
  AccessTokenStoreInput,
} from "../interfaces/access-token-store-interface";
import { DUMMY_SUBJECT_ID } from "../services/user-profile-dynamodb-service";

const MOCK_SUBJECT_ID = DUMMY_SUBJECT_ID;
const MOCK_CLAIMS = ["claim1"];
const MOCK_SECTOR_IDENTIFIER = "9876543";
const MOCK_IS_NEW_ACCOUNT = false;
const MOCK_PASSWORD_RESET_TIME = 12;
const MOCK_HAS_BEEN_USED = false;
const MOCK_TTL = 3600;

export interface AccessTokenStoreOptions {
  accessToken: string;
  subjectId?: string;
  claims?: string[];
  sectorIdentifier?: string;
  isNewAccount?: boolean;
  passwordResetTime?: number;
  hasBeenUsed?: boolean;
  ttl?: number;
}

export const createAccessTokenStoreInput = (
  accessToken: string
): AccessTokenStoreInput => {
  return {
    accessToken: accessToken,
    subjectId: MOCK_SUBJECT_ID,
    claims: MOCK_CLAIMS,
    sectorIdentifier: MOCK_SECTOR_IDENTIFIER,
    isNewAccount: MOCK_IS_NEW_ACCOUNT,
    passwordResetTime: MOCK_PASSWORD_RESET_TIME,
    hasBeenUsed: MOCK_HAS_BEEN_USED,
  };
};

export const createAccessTokenStore = (
  accessToken: string
): AccessTokenStore => {
  return {
    accessToken: accessToken,
    subjectId: MOCK_SUBJECT_ID,
    claims: MOCK_CLAIMS,
    sectorIdentifier: MOCK_SECTOR_IDENTIFIER,
    isNewAccount: MOCK_IS_NEW_ACCOUNT,
    passwordResetTime: MOCK_PASSWORD_RESET_TIME,
    hasBeenUsed: MOCK_HAS_BEEN_USED,
    ttl: MOCK_TTL,
  };
};

export const createCustomAccessTokenStore = (
  accessTokenStoreOptions: AccessTokenStoreOptions
): AccessTokenStore => {
  return {
    accessToken: accessTokenStoreOptions.accessToken,
    subjectId: accessTokenStoreOptions.subjectId ?? MOCK_SUBJECT_ID,
    claims: accessTokenStoreOptions.claims ?? MOCK_CLAIMS,
    sectorIdentifier:
      accessTokenStoreOptions.sectorIdentifier ?? MOCK_SECTOR_IDENTIFIER,
    isNewAccount: accessTokenStoreOptions.isNewAccount ?? MOCK_IS_NEW_ACCOUNT,
    passwordResetTime:
      accessTokenStoreOptions.passwordResetTime ?? MOCK_PASSWORD_RESET_TIME,
    hasBeenUsed: accessTokenStoreOptions.hasBeenUsed ?? MOCK_HAS_BEEN_USED,
    ttl: accessTokenStoreOptions.ttl ?? MOCK_TTL,
  };
};
