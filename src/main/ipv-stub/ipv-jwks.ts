import { exportJWK } from "jose";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { getIpvPublicKey } from "./helper/key-helpers";
import {
  CodedError,
  handleErrors,
  methodNotAllowedError,
} from "./helper/result-helper";
import { createHash } from "node:crypto";

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
    const jwk = await exportJWK(await getIpvPublicKey());
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keys: [
          {
            ...jwk,
            kid: jwk.n ? generateKid(jwk.n) : "n/a",
            use: "enc",
            alg: "RSA256",
          },
        ],
      }),
    };
  } catch (error) {
    throw new CodedError(
      500,
      `Unable to parse IPV public key to JWK. Error: ${error}`
    );
  }
}

const generateKid = (key: string): string => {
  const hash = createHash("sha256");
  return hash.update(Buffer.from(key, "ascii")).digest().toString("base64url");
};
