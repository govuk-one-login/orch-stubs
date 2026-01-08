import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { AuthCodeStoreInput } from "./interfaces/auth-code-store-interface";
import { addAuthCodeStore } from "./services/auth-code-dynamodb-service";
import {
  addUserProfile,
  getUserProfileByEmail,
} from "./services/user-profile-dynamodb-service";
import { getOrchToAuthExpectedClientId } from "./helpers/config";
import { decrypt } from "./helpers/decryption-helper";
import { validateClaims } from "./helpers/jwt-helper";
import { generateAuthCode } from "./helpers/auth-code-generator";
import { Claims } from "./helpers/claims-config";
import {
  CodedError,
  handleErrors,
  successfulHtmlResult,
  successfulJsonResult,
} from "../helper/result-helper";
import { ROOT_URI } from "./data/auth-dummy-constants";
import { createUserPofile } from "./helpers/mock-token-data-helper";
import renderAuthAuthorize from "./render-auth-authorize";
import { AuthRequestBody } from "./interfaces/auth-request-body-interface";
import { logger } from "../logger";

const SFAD_ERROR: string = "SFAD_ERROR";
const AUTHORIZE_ERRORS: string[] = [SFAD_ERROR];

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return handleErrors(async () => {
    switch (event.httpMethod) {
      case "GET":
        return get(event);
      case "POST":
        return post(event);
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

async function get(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const queryStringParams = event.queryStringParameters;
  if (!queryStringParams) {
    throw new CodedError(400, "Missing query parameters");
  }

  const clientId = queryStringParams.client_id!;
  const responseType = queryStringParams.response_type!;
  const requestBody = queryStringParams?.request;

  if (!requestBody) {
    throw new CodedError(400, "Missing request in query parameters");
  }

  const parsedBody = Object.fromEntries(new URLSearchParams(requestBody));
  const email = parsedBody.email ?? "dummy.email@mail.com";
  const passwordResetTime = parsedBody.password_reset_time
    ? Number(parsedBody.password_reset_time)
    : 10;

  let claims: Claims;

  try {
    validateQueryParams(clientId, responseType);
    const encryptedAuthRequestJWE = requestBody;
    const authRequestJweDecryptedAsJwt = await decrypt(encryptedAuthRequestJWE);
    claims = await validateClaims(authRequestJweDecryptedAsJwt);
  } catch (error) {
    throw new CodedError(
      400,
      error instanceof Error ? error.message : "Unknown error."
    );
  }

  try {
    await addUserProfile(createUserPofile("dummy.email@mail.com"));
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  const authRequest: AuthRequestBody = {
    clientId: clientId,
    responseType: responseType,
    email: email,
    passwordResetTime: passwordResetTime,
    sectorIdentifier: parsedBody.sectorIdentifier,
    isNewAccount: parsedBody.isNewAccount,
    claims: claims,
  };

  return successfulHtmlResult(
    200,
    renderAuthAuthorize(authRequest, AUTHORIZE_ERRORS)
  );
}

async function post(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const redirectUri = `${ROOT_URI}/orchestration-redirect`;
  const url = new URL(redirectUri);
  const bodyUrlParams = new URLSearchParams(event.body!);
  const body = Object.fromEntries(bodyUrlParams);
  if (body.error) {
    return successfulJsonResult(
      302,
      {},
      {
        Location: `${url.toString()}?error=${body.error}`,
      }
    );
  }
  logger.info("Parsing authRequest in body");
  const authRequest: AuthRequestBody = JSON.parse(
    body.authRequest
  ) as unknown as AuthRequestBody;

  let authCode: string;

  try {
    logger.info("Getting user profile by email");
    const user = await getUserProfileByEmail(authRequest.email);
    logger.info("Parsing claims list");
    const claimsList = authRequest.claims.claim
      ? JSON.parse(authRequest.claims.claim)
      : [];

    logger.info("Generating auth code");
    authCode = generateAuthCode();
    const authCodeResult: AuthCodeStoreInput = {
      authCode,
      subjectId: user.subjectId,
      claims: claimsList,
      sectorIdentifier: authRequest.sectorIdentifier,
      isNewAccount: authRequest.isNewAccount === "true",
      passwordResetTime: authRequest.passwordResetTime,
      hasBeenUsed: false,
    };
    logger.info("Storing auth code");
    await addAuthCodeStore(authCodeResult);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  url.searchParams.append("code", authCode);
  url.searchParams.append("state", authRequest.claims.state);

  return successfulJsonResult(
    302,
    {
      message: `Redirecting to ${url.toString()}`,
    },
    {
      Location: url.toString(),
    }
  );
}

function validateQueryParams(clientId: string, responseType: string) {
  if (responseType === null || responseType === undefined) {
    throw new CodedError(400, "Response type is not set");
  }
  if (clientId !== getOrchToAuthExpectedClientId()) {
    throw new CodedError(400, "Client ID value is incorrect");
  }
}
