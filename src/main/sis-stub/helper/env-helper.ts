import { logger } from "../../../main/logger.ts";
import { CodedError } from "../../helper/result-helper.ts";

type EnvVar = "SIS_AUTHORIZE_PUBLIC_ENCRYPTION_KEY" | "ENVIRONMENT";

export const getEnv = (key: EnvVar, throwIfMissing = true): string => {
  const envVar = process.env[key];

  if (!envVar && throwIfMissing) {
    logger.error(`Environment variable not set: ${key}`);
    throw new CodedError(500, "Environment variable not set");
  }

  return envVar ?? "";
};
