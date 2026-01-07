import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { addAccessTokenStore } from "./services/access-token-dynamodb-service";
import { createAccessTokenStoreInput } from "./helpers/mock-token-data-helper";
import { updateHasBeenUsedAuthCodeStore } from "./services/auth-code-dynamodb-service";
import { createBearerAccessToken } from "./helpers/create-token-helper";
import { CodedError, handleErrors } from "../helper/result-helper";
import { logger } from "../logger";
import {
  ensureClientAssertionType,
  validateAuthCode,
  validatePlainTextParameters,
  verifyClientAssertion,
} from "./helpers/token-validation-helper";
import {
  getOrchToAuthExpectedClientId,
  getOrchToAuthSigningPublicKey,
} from "./helpers/config";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return handleErrors(async () => {
    switch (event.httpMethod) {
      case "POST":
        return await post(event);
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({
            message: "Method not allowed",
          }),
        };
    }
  });
};

async function post(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const body = getBody(event);
  const authCode = body["code"];

  try {
    await validateAuthCode(authCode);
    // The redirect between orch and auth is never used and is in auths code
    // just as part of Oauth2 formalities so left empty.
    // Since its in Auth's code we have replicated the validation in the stub as well.
    validatePlainTextParameters("", getOrchToAuthExpectedClientId(), body);
    ensureClientAssertionType(body);
    await verifyClientAssertion(body, getOrchToAuthSigningPublicKey());
  } catch (error) {
    throw new CodedError(
      400,
      error instanceof Error ? error.message : "Unknown error."
    );
  }

  const accessToken = createBearerAccessToken();

  try {
    await addAccessTokenStore(
      createAccessTokenStoreInput(accessToken.access_token)
    );
    await updateHasBeenUsedAuthCodeStore(authCode, true);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(accessToken),
  };
}

function getBody(event: APIGatewayProxyEvent) {
  if (event.body == null) {
    logger.error(`Missing request body`);
    throw new CodedError(400, "Missing request body");
  }
  return Object.fromEntries(new URLSearchParams(event.body));
}
