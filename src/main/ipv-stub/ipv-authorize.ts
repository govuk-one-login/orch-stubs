import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { logger } from "../logger.ts";
import { compactDecrypt, base64url, jwtVerify } from "jose";
import renderIPVAuthorize from "./render-ipv-authorize.ts";
import {
  CodedError,
  handleErrors,
  methodNotAllowedError,
  createHtmlResult,
} from "../helper/result-helper.ts";
import { putStateWithAuthCode } from "../shared-identity/service/dynamodb-form-response-service.ts";
import { randomBytes } from "crypto";
import { getIpvPrivateKey, getIpvOrchJwks } from "./helper/key-helpers.ts";
import { ROOT_URI } from "../shared-identity/data/identity-dummy-constants.ts";
import { handlePost } from "../shared-identity/helper/authorize-helpers.ts";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return handleErrors(async () => {
    switch (event.httpMethod) {
      case "GET":
        return await get(event);
      case "POST":
        return await post(event);
      default:
        throw methodNotAllowedError(event.httpMethod);
    }
  });
};

async function get(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.info("IPV Authorize GET endpoint invoked!");

  if (event.queryStringParameters == null) {
    throw new CodedError(400, "Query string parameters are null");
  }
  const requestObject = event.queryStringParameters.request!;

  if (!requestObject) {
    throw new CodedError(400, "Request query string parameter not found");
  }

  const orchJwks = getIpvOrchJwks();
  const ipvPrivateKey = await getIpvPrivateKey();

  const { plaintext } = await compactDecrypt(requestObject, ipvPrivateKey);
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

  const header = jwt.protectedHeader;
  const payload = jwt.payload;

  const authCode = base64url.encode(randomBytes(32));
  try {
    await putStateWithAuthCode(authCode, payload.state as string);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  return createHtmlResult(200, renderIPVAuthorize(header, payload, authCode));
}

async function post(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const redirectUri = `${ROOT_URI}/ipv-callback`;
  const url = new URL(redirectUri);
  return handlePost(event.body || undefined, url, handlePostErrors);
}

const handlePostErrors = (
  parsedBody: Record<string, string>,
  url: URL
): URL | undefined => {
  if (parsedBody["oAuth-error-yes"] === "yes") {
    url.searchParams.append("error", parsedBody.oAuthError);
    url.searchParams.append(
      "error_description",
      parsedBody.oAuthErrorDescription
    );
    return url;
  }
};
