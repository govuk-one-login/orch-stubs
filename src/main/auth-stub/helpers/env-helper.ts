import { CodedError } from "../../helper/result-helper";
import { logger } from "../../logger";

type EnvVar =
  | "ENCRYPTION_KEY_ID"
  | "ORCH_TO_AUTH_TOKEN_SIGNING_PUBLIC_KEY"
  | "AWS_REGION"
  | "ORCH_TO_AUTH_AUDIENCE"
  | "ORCH_TO_AUTH_CLIENT_ID"
  | "AUTH_AUTHORIZE_PUBLIC_SIGNING_KEY"
  | "LOCAL_AUTH_AUTHORIZE_PRIVATE_ENCRYPTION_KEY"
  | "ENVIRONMENT"
  | "AUTH_JWKS_URL";

export const getEnv = (key: EnvVar, throwIfMissing = true): string => {
  const envVar = process.env[key];

  if (!envVar && throwIfMissing) {
    logger.error(`Environment variable not set: ${key}`);
    throw new CodedError(500, `Environment variable ${key} not set`);
  }

  return envVar ?? "";
};
