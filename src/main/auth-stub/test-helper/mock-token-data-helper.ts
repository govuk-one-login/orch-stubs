import {
  AccessTokenStore,
  AccessTokenStoreInput,
} from "../interfaces/access-token-store-interface";

const MOCK_SUBJECT_ID = "123456";
const MOCK_CLAIMS = ["claim1"];
const MOCK_SECTOR_IDENTIFIER = "9876543";
const MOCK_IS_NEW_ACCOUNT = false;
const MOCK_PASSWORD_RESET_TIME = 12;
const MOCK_HAS_BEEN_USED = false;
const MOCK_TTL = 3600;

export const createAccessTokenStoreInput = (
  token: string
): AccessTokenStoreInput => {
  return {
    token: token,
    subjectId: MOCK_SUBJECT_ID,
    claims: MOCK_CLAIMS,
    sectorIdentifier: MOCK_SECTOR_IDENTIFIER,
    isNewAccount: MOCK_IS_NEW_ACCOUNT,
    passwordResetTime: MOCK_PASSWORD_RESET_TIME,
    hasBeenUsed: MOCK_HAS_BEEN_USED,
  };
};

export const createAcessTokenStore = (token: string): AccessTokenStore => {
  return {
    token: token,
    subjectId: MOCK_SUBJECT_ID,
    claims: MOCK_CLAIMS,
    sectorIdentifier: MOCK_SECTOR_IDENTIFIER,
    isNewAccount: MOCK_IS_NEW_ACCOUNT,
    passwordResetTime: MOCK_PASSWORD_RESET_TIME,
    hasBeenUsed: MOCK_HAS_BEEN_USED,
    ttl: MOCK_TTL,
  };
};
