import { logger } from "src/main/logger";
import { CodedError } from "./result-helper";

type EnvVar =
  | "IPV_AUTHORIZE_PRIVATE_ENCRYPTION_KEY"
  | "ORCH_PUBLIC_SIGNING_KEY"
  | "ENVIRONMENT";

export const getEnv = (key: EnvVar, throwIfMissing = true): string => {
  const envVar = process.env[key];

  if (!envVar && throwIfMissing) {
    logger.error(`Environment variable not set: ${key}`);
    throw new CodedError(500, "Environment variable not set");
  }

  return envVar ?? "";
};