const env =
  process.env.ENVIRONMENT == "dev" ? "sandpit" : process.env.ENVIRONMENT;

export const ROOT_URI = `https://oidc.${env}.account.gov.uk`;
