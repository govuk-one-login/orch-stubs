import {
  createLocalJWKSet,
  createRemoteJWKSet,
  FlattenedJWSInput,
  importPKCS8,
  importSPKI,
  JWSHeaderParameters,
  KeyLike,
} from "jose";
import { logger } from "../../../main/logger";
import { getEnv } from "./env-helper";
import { CodedError } from "./result-helper";

type JWKSVerifier = (
  protectedHeader?: JWSHeaderParameters,
  token?: FlattenedJWSInput
) => Promise<KeyLike>;
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
      timeoutDuration: 9 * 1000, //9 seconds
    });
  }
};

export const getIpvPrivateKey = async (): Promise<KeyLike> => {
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

export const getIpvPublicKey = async (): Promise<KeyLike> => {
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
