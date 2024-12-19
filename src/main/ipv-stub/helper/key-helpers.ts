import { importPKCS8, importSPKI, KeyLike } from "jose";
import { logger } from "../../../main/logger";
import { getEnv } from "./env-helper";
import { CodedError } from "./result-helper";

export const getOrchPublicSigningKey = async (): Promise<KeyLike> => {
  const orchKeyPem = getEnv("ORCH_PUBLIC_SIGNING_KEY");
  try {
    return importSPKI(orchKeyPem, "ES256");
  } catch (error) {
    logger.error(
      "Failed to parse Orch signing key: " + (error as Error).message
    );
    throw new CodedError(500, "Internal Server Error");
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
