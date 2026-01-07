const env =
  process.env.ENVIRONMENT == "dev" ? "authdev3.dev" : process.env.ENVIRONMENT;

export const ROOT_URI = `https://oidc.${env}.account.gov.uk`;
