import { getEnv } from "./env-helper";

export const getAwsRegion = (): string => {
  const envAwsRegion = getEnv("AWS_REGION");
  return envAwsRegion !== "" ? envAwsRegion : "eu-west-2";
};

export const getKmsKeyId = (): string => {
  return getEnv("ENCRYPTION_KEY_ID");
};

export const getOrchToAuthExpectedClientId = (): string => {
  const envOrchToAuthAudience = getEnv("ORCH_TO_AUTH_CLIENT_ID");
  return envOrchToAuthAudience !== "" ? envOrchToAuthAudience : "UNKNOWN";
};

export const getOrchToAuthExpectedAudience = (): string => {
  const envOrchToAuthAudience = getEnv("ORCH_TO_AUTH_AUDIENCE");
  return envOrchToAuthAudience !== "" ? envOrchToAuthAudience : "UNKNOWN";
};
