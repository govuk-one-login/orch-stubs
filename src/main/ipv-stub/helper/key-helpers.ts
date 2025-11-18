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
import { getEnv } from "./env-helper.ts";
import { CodedError } from "../../helper/result-helper.ts";

type JWKSVerifier = (
  protectedHeader?: JWSHeaderParameters,
  token?: FlattenedJWSInput
) => Promise<CryptoKey>;
export const getOrchJwks = (): JWKSVerifier => {
  const localJwks = getEnv("DUMMY_ORCH_JWKS", false);
  if (localJwks) {
    logger.info(
      "Found DUMMY_ORCH_JWKS env variable. Using value as JWKS source"
    );
    return createLocalJWKSet(JSON.parse(localJwks));
  } else {
    const urlString = getEnv("ORCH_PUBLIC_SIGNING_JWKS_URL");
    logger.info("Fetching JWKS from URL " + urlString);
    return createRemoteJWKSet(new URL(urlString), {
      timeoutDuration: 10 * 1000, //10 seconds
    });
  }
};

export const getIpvPrivateKey = async (): Promise<CryptoKey> => {
  const ipvPrivateKeyPem = getEnv("IPV_AUTHORIZE_PRIVATE_ENCRYPTION_KEY");
  try {
    return importPKCS8(ipvPrivateKeyPem, "RSA-OAEP-256");
  } catch (error) {
    logger.error(
      "Failed to parse IPV private encryption key: " + (error as Error).message
    );
    throw new CodedError(500, "Internal Server Error");
  }
};

export const getIpvPublicKey = async (): Promise<CryptoKey> => {
  const ipvPublicKeyPem = getEnv("IPV_AUTHORIZE_PUBLIC_ENCRYPTION_KEY");
  try {
    return importSPKI(ipvPublicKeyPem, "RSA-OAEP-256");
  } catch (error) {
    logger.error(
      "Failed to parse IPV authorize public encryption key: " +
        (error as Error).message
    );
    throw new CodedError(500, "Internal Server Error");
  }
};
