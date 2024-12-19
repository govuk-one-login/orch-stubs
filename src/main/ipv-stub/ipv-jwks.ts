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
  let jwk;
  try {
    jwk = await exportJWK(await getIpvPublicKey());
    // jwk.kid = "cZAbEssn-E8d9-g1sN-jSAx-FscARcpv5H4Y";
    // jwk.use = "enc";
    // jwk.alg = "RSA256";
  } catch (error) {
    throw new CodedError(
      500,
      `Unable to parse IPV public key to JWK. Error: ${error}`
    );
  }
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jwk),
  };
}
