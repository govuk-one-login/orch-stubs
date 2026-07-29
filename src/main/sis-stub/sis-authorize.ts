import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import {
  CodedError,
  createHtmlResult,
  handleErrors,
  methodNotAllowedError,
} from "../helper/result-helper";
import { logger } from "../logger";
import { base64url, compactDecrypt, jwtVerify } from "jose";
import { randomBytes } from "crypto";
import { putStateWithAuthCode } from "../shared-identity/service/dynamodb-form-response-service";
import {
  getOrchJwks,
  getPrivateKey,
} from "../shared-identity/helper/key-helpers";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return handleErrors(async () => {
    switch (event.httpMethod) {
      case "GET":
        return await get(event);
      default:
        throw methodNotAllowedError(event.httpMethod);
    }
  });
};

async function get(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.info("SIS Authorize GET endpoint invoked!");

  if (event.queryStringParameters == null) {
    throw new CodedError(400, "Query string parameters are null");
  }
  const requestObject = event.queryStringParameters.request!;

  if (!requestObject) {
    throw new CodedError(400, "Request query string parameter not found");
  }

  const orchJwks = getSisOrchJwks();
  const sisPrivateKey = await getSisPrivateKey();

  const { plaintext } = await compactDecrypt(requestObject, sisPrivateKey);
  const encodedJwt = new TextDecoder().decode(plaintext);

  const parts = encodedJwt.split(".");
  if (parts.length !== 3) {
    throw new CodedError(400, "Decrypted JWT is in invalid format");
  }

  let jwt;
  try {
    jwt = await jwtVerify(encodedJwt, orchJwks);
  } catch (error) {
    logger.error(
      `Failed to verify client_assertion from orchestration: ${(error as Error).message}`
    );
    throw new CodedError(500, "Signature verification failed");
  }

  const _header = jwt.protectedHeader;
  const payload = jwt.payload;

  const authCode = base64url.encode(randomBytes(32));
  try {
    await putStateWithAuthCode(authCode, payload.state as string);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  return createHtmlResult(200, "Authorize get successful");
}

const getSisOrchJwks = () => getOrchJwks("DUMMY_JWKS", "ORCH_SIS_JWKS_URL");
const getSisPrivateKey = () => getPrivateKey("SIS_PRIVATE_ENCRYPTION_KEY");
