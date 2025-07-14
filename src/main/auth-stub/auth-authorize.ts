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
import { logger } from "../logger";
import { compactDecrypt, jwtVerify } from "jose";

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
  logger.info("Auth Authorize GET endpoint invoked!");

  if (event.queryStringParameters == null) {
    throw new CodedError(400, "Query string parameters are null");
  }
  const requestObject = event.queryStringParameters["request"] as string;

  if (!requestObject) {
    throw new CodedError(400, "Request query string parameter not found");
  }

  const orchJwks = getOrchJwks();
  const authPrivateKey = await getAuthPrivateKey();

  const { plaintext } = await compactDecrypt(requestObject, authPrivateKey);
  const encodedJwt = plaintext.toString();

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

  const authCode = generateAuthCode();

  try {
    await addUserProfile(createUserPofile("dummy.email@mail.com"));
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }
  return successfulHtmlResult(
    200,
    renderAuthAuthorize(header, payload, authCode)
  );
}

async function post(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const redirectUri = `${ROOT_URI}/orchestration-redirect`;

  if (!event.body) {
    throw new CodedError(400, "Missing request body");
  }
  const url = new URL(redirectUri);

  const parsedBody = Object.fromEntries(new URLSearchParams(event.body));
  const clientId = parsedBody.client_id;
  const responseType = parsedBody.response_type;
  const email = parsedBody.email ?? "dummy.email@mail.com";
  const passwordResetTime = parsedBody.password_reset_time
    ? Number(parsedBody.password_reset_time)
    : 10;
  const authCode = parsedBody["authCode"];

  let claims: Claims;

  try {
    validateQueryParams(clientId, responseType);
    const encryptedAuthRequestJWE = parsedBody["request"];
    const authRequestJweDecryptedAsJwt = await decrypt(encryptedAuthRequestJWE);
    claims = await validateClaims(authRequestJweDecryptedAsJwt);
  } catch (error) {
    throw new CodedError(
      400,
      error instanceof Error ? error.message : "Unknown error."
    );
  }

  try {
    const user = await getUserProfileByEmail(email);
    const claimsList = claims.claim ? JSON.parse(claims.claim) : [];

    const authCodeResult: AuthCodeStoreInput = {
      authCode,
      subjectId: user.subjectId,
      claims: claimsList,
      sectorIdentifier: parsedBody.sectorIdentifier,
      isNewAccount: parsedBody.isNewAccount === "true",
      passwordResetTime,
      hasBeenUsed: false,
    };

    await addAuthCodeStore(authCodeResult);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  url.searchParams.append("code", authCode);

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
