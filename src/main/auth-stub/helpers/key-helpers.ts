import {
  createLocalJWKSet,
  createRemoteJWKSet,
  FlattenedJWSInput,
  JWSHeaderParameters,
  KeyLike,
} from "jose";
import { logger } from "../../../main/logger";
import { getEnv } from "./env-helper";

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

export const getAuthPublicKey = (): string => {
  return "";
};
