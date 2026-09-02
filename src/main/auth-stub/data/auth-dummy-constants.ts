const env = process.env.ENVIRONMENT || "local";

export const ROOT_URI =
  process.env.ORCH_BASE_URL || `https://oidc.${env}.account.gov.uk`;
