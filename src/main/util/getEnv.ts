import { AisStubEnvVar } from "../ais-stub/types/AisStubEnvVar";

export type BaseEnvVar = "ENVIRONMENT" | "LOCALSTACK_ENDPOINT";

export const getEnv = (name: BaseEnvVar | AisStubEnvVar): string => {
  if (!process.env[name]) {
    throw new Error("Unset environment variable: " + name);
  }

  return process.env[name];
};
