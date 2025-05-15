import { CodedError } from "../../helper/result-helper";
import { logger } from "../../logger";

type EnvVar =
  | "ENCRYPTION_KEY_ID"
  | "AWS_REGION"
  | "ORCH_TO_AUTH_AUDIENCE"
  | "ORCH_TO_AUTH_CLIENT_ID"
  | "AUTH_AUTHORIZE_PUBLIC_ENCRYPTION_KEY"
  | "DUMMY_ENCRYPTION_PUBLIC_KEY"
  | "ENVIRONMENT";

export const getEnv = (key: EnvVar, throwIfMissing = true): string => {
  const envVar = process.env[key];

  if (!envVar && throwIfMissing) {
    logger.error(`Environment variable not set: ${key}`);
    throw new CodedError(500, `Environment variable ${key} not set`);
  }

  return envVar ?? "";
};
