import { exportJWK, importSPKI } from "jose";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import {
  CodedError,
  createJsonResult,
  handleErrors,
  methodNotAllowedError,
} from "../helper/result-helper.ts";
import { createHash } from "node:crypto";
import { getEnv } from "./helper/env-helper.ts";
import { logger } from "../logger.ts";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return handleErrors(async () => {
    switch (event.httpMethod) {
      case "GET":
        return await get();
      default:
        throw methodNotAllowedError(event.httpMethod);
    }
  });
};

async function get(): Promise<APIGatewayProxyResult> {
  try {
    const jwk = await exportJWK(await getSisPublicKey());
    return createJsonResult(200, {
      keys: [
        {
          ...jwk,
          kid: jwk.n ? generateKid(jwk.n) : "n/a",
          use: "enc",
          alg: "RS256",
        },
      ],
    });
  } catch (error) {
    throw new CodedError(
      500,
      `Unable to parse public key to JWK. Error: ${error}`
    );
  }
}

const generateKid = (key: string): string => {
  const hash = createHash("sha256");
  return hash.update(Buffer.from(key, "ascii")).digest().toString("base64url");
};

const getSisPublicKey = async (): Promise<CryptoKey> => {
  const publicKeyPem = getEnv("SIS_AUTHORIZE_PUBLIC_ENCRYPTION_KEY");
  try {
    return importSPKI(publicKeyPem, "RSA-OAEP-256");
  } catch (error) {
    logger.error(
      "Failed to parse SIS authorize public encryption key: " +
        (error as Error).message
    );
    throw new CodedError(500, "Internal Server Error");
  }
};
