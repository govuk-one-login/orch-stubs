import {
  createLocalJWKSet,
  createRemoteJWKSet,
  FlattenedJWSInput,
  importPKCS8,
  importSPKI,
  JWSHeaderParameters,
  CryptoKey,
} from "jose";
import { logger } from "../../../main/logger.ts";
import { CodedError } from "../../helper/result-helper.ts";

type JWKSVerifier = (
  protectedHeader?: JWSHeaderParameters,
  token?: FlattenedJWSInput
) => Promise<CryptoKey>;
export const getOrchJwks = (
  dummyJwksEnvVar: string,
  jwksUrlEnvVar: string
): JWKSVerifier => {
  const localJwks = getEnv(dummyJwksEnvVar, false);
  if (localJwks) {
    logger.info("Found DUMMY_JWKS env variable. Using value as JWKS source");
    return createLocalJWKSet(JSON.parse(localJwks));
  } else {
    const urlString = getEnv(jwksUrlEnvVar);
    logger.info("Fetching JWKS from URL " + urlString);
    return createRemoteJWKSet(new URL(urlString), {
      timeoutDuration: 10 * 1000, //10 seconds
    });
  }
};

export const getPrivateKey = async (envVar: string): Promise<CryptoKey> => {
  const privateKeyPem = getEnv(envVar);
  try {
    return importPKCS8(privateKeyPem, "RSA-OAEP-256");
  } catch (error) {
    logger.error(
      "Failed to parse private encryption key: " + (error as Error).message
    );
    throw new CodedError(500, "Internal Server Error");
  }
};

export const getPublicKey = async (envVar: string): Promise<CryptoKey> => {
  const ipvPublicKeyPem = getEnv(envVar);
  try {
    return importSPKI(ipvPublicKeyPem, "RSA-OAEP-256");
  } catch (error) {
    logger.error(
      "Failed to parse public encryption key: " + (error as Error).message
    );
    throw new CodedError(500, "Internal Server Error");
  }
};

const getEnv = (key: string, throwIfMissing = true): string => {
  const envVar = process.env[key];

  if (!envVar && throwIfMissing) {
    logger.error(`Environment variable not set: ${key}`);
    throw new CodedError(500, "Environment variable not set");
  }

  return envVar ?? "";
};
