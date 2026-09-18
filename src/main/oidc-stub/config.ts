import { readFile } from "fs/promises";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { ClientMetadata } from "oidc-provider";

interface OidcConsumerConfig extends ClientMetadata {
  provider_url: string;
}

export const fetchConfiguration = async (): Promise<OidcConsumerConfig> => {
  let config;
  if (!process.env.ENVIRONMENT || process.env.ENVIRONMENT === "local") {
    config = await readFile("config.local.json", "utf8");
  } else {
    const secretsManagerClient = new SecretsManagerClient({
      region: "eu-west-2",
    });
    config = (
      await secretsManagerClient.send(
        new GetSecretValueCommand({
          SecretId: `${process.env.ENVIRONMENT}-stub-client-config`,
        })
      )
    ).SecretString;
    if (!config) {
      throw new Error(
        `Could not find secret with id ${process.env.ENVIRONMENT}-stub-client-config`
      );
    }
  }
  const parsedConfig = JSON.parse(config) as OidcConsumerConfig;
  const requiredFields = ["provider_url", "client_id", "redirect_uris"];
  const missingFields = [];
  for (const requiredField of requiredFields) {
    if (!parsedConfig[requiredField]) {
      missingFields.push(requiredField);
    }
  }
  if (missingFields.length > 0) {
    throw new Error(
      `Config does not have required fields: ${JSON.stringify(missingFields)}`
    );
  }
  return parsedConfig;
};
