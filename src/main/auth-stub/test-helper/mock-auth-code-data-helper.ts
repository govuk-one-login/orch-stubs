import {
  AuthCodeStore,
  AuthCodeStoreInput,
} from "../interfaces/auth-code-store-interface";

const MOCK_SUBJECT_ID = "123456";
const MOCK_CLAIMS = ["claim1"];
const MOCK_SECTOR_IDENTIFIER = "9876543";
const MOCK_IS_NEW_ACCOUNT = false;
const MOCK_PASSWORD_RESET_TIME = 12;
const MOCK_HAS_BEEN_USED = false;
const MOCK_JOURNEY_ID = "mock_journey_id";

export const createAuthCodeStoreInput = (
  authCode: string
): AuthCodeStoreInput => {
  return {
    authCode: authCode,
    subjectId: MOCK_SUBJECT_ID,
    claims: MOCK_CLAIMS,
    sectorIdentifier: MOCK_SECTOR_IDENTIFIER,
    isNewAccount: MOCK_IS_NEW_ACCOUNT,
    passwordResetTime: MOCK_PASSWORD_RESET_TIME,
    hasBeenUsed: MOCK_HAS_BEEN_USED,
    journeyId: MOCK_JOURNEY_ID,
  };
};

export const createAuthCodeStore = (authCode: string): AuthCodeStore => {
  return {
    authCode: authCode,
    subjectId: MOCK_SUBJECT_ID,
    claims: MOCK_CLAIMS,
    sectorIdentifier: MOCK_SECTOR_IDENTIFIER,
    isNewAccount: MOCK_IS_NEW_ACCOUNT,
    passwordResetTime: MOCK_PASSWORD_RESET_TIME,
    hasBeenUsed: MOCK_HAS_BEEN_USED,
    ttl: createTimeFromNow(3600),
    journeyId: MOCK_JOURNEY_ID,
  };
};

export const createAuthCodeStoreThatHasBeenUsed = (
  authCode: string
): AuthCodeStore => {
  return {
    authCode: authCode,
    subjectId: MOCK_SUBJECT_ID,
    claims: MOCK_CLAIMS,
    sectorIdentifier: MOCK_SECTOR_IDENTIFIER,
    isNewAccount: MOCK_IS_NEW_ACCOUNT,
    passwordResetTime: MOCK_PASSWORD_RESET_TIME,
    hasBeenUsed: true,
    ttl: createTimeFromNow(3600),
    journeyId: MOCK_JOURNEY_ID,
  };
};

export const createAuthCodeStoreThatHasExpired = (
  authCode: string
): AuthCodeStore => {
  return {
    authCode: authCode,
    subjectId: MOCK_SUBJECT_ID,
    claims: MOCK_CLAIMS,
    sectorIdentifier: MOCK_SECTOR_IDENTIFIER,
    isNewAccount: MOCK_IS_NEW_ACCOUNT,
    passwordResetTime: MOCK_PASSWORD_RESET_TIME,
    hasBeenUsed: true,
    ttl: createTimeFromNow(-3600),
    journeyId: MOCK_JOURNEY_ID,
  };
};

function createTimeFromNow(time: number) {
  return Math.floor(Date.now() / 1000) + time;
}
