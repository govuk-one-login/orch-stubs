import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { AuthCodeStoreInput } from "./interfaces/auth-code-store-interface.ts";
import { addAuthCodeStore } from "./services/auth-code-dynamodb-service.ts";
import { addUserProfile } from "./services/user-profile-dynamodb-service.ts";
import { getOrchToAuthExpectedClientId } from "./helpers/config.ts";
import { decrypt } from "./helpers/decryption-helper.ts";
import { validateClaims } from "./helpers/jwt-helper.ts";
import { generateAuthCode } from "./helpers/auth-code-generator.ts";
import { Claims } from "./helpers/claims-config.ts";
import {
  CodedError,
  handleErrors,
  createHtmlResult,
  createJsonResult,
} from "../helper/result-helper.ts";
import { ROOT_URI } from "./data/auth-dummy-constants.ts";
import renderAuthAuthorize from "./render-auth-authorize.ts";
import { AuthRequestBody } from "./interfaces/auth-request-body-interface.ts";
import { logger } from "../logger.ts";
import {
  UserProfile,
  UserProfileClaims,
} from "./interfaces/user-profile-interface.ts";

const SFAD_ERROR = "SFAD_ERROR";
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
        return createJsonResult(405, {
          message: "Method not allowed",
        });
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

  const authRequest: AuthRequestBody = {
    clientId: clientId,
    responseType: responseType,
    passwordResetTime: passwordResetTime,
    sectorIdentifier: parsedBody.sectorIdentifier,
    isNewAccount: parsedBody.isNewAccount === "true",
    claims: claims,
  };

  return createHtmlResult(
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
    return createJsonResult(
      302,
      {},
      {
        Location: `${url.toString()}?error=${body.error}`,
      }
    );
  }
  logger.info("Parsing authRequest in body");
  const authRequestFields = getPrefixedFields(
    body,
    "auth-request-"
  ) as unknown as AuthRequestBody;
  const claims = getPrefixedFields(body, "claims-") as unknown as Claims;
  const userProfile = getPrefixedFields(
    body,
    "userinfo-"
  ) as unknown as UserProfile;

  logger.info("Storing user profile");
  try {
    await addUserProfile(userProfile);
    console.log(userProfile);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  const authRequest: AuthRequestBody = {
    ...authRequestFields,
    claims: {
      ...claims,
      claim: JSON.stringify({ userinfo: userProfile as UserProfileClaims }),
    },
  };

  let authCode: string;

  try {
    logger.info("Parsing claims list");
    const claimsList = Object.keys(userProfile as UserProfileClaims) ?? {};

    logger.info("Generating auth code");

    const journeyId = authRequest.claims.govuk_signin_journey_id;
    authCode = generateAuthCode();
    const authCodeResult: AuthCodeStoreInput = {
      authCode,
      subjectId: userProfile.subject_id,
      claims: claimsList,
      sectorIdentifier: authRequest.sectorIdentifier,
      isNewAccount: authRequest.isNewAccount,
      passwordResetTime: authRequest.passwordResetTime,
      hasBeenUsed: false,
      journeyId: journeyId,
    };
    logger.info("Storing auth code");
    await addAuthCodeStore(authCodeResult);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  url.searchParams.append("code", authCode);
  url.searchParams.append("state", authRequest.claims.state);

  return createJsonResult(
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

function getPrefixedFields(
  body: Record<string, string>,
  prefix: string
): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.keys(body)
      .filter((key) => key.startsWith(prefix))
      .map((key) => [key.substring(prefix.length), body[key] || undefined])
  );
}
