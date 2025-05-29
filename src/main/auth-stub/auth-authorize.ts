import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { AuthCodeStoreInput } from "./interfaces/auth-code-store-interface";
import { addAuthCodeStore } from "./services/auth-code-dynamodb-service";
import { getUserProfileByEmail } from "./services/user-profile-dynamodb-service";
import { getOrchToAuthExpectedClientId } from "./helpers/config";
import { decrypt } from "./helpers/decryption-helper";
import { validateClaims } from "./helpers/jwt-helper";
import { generateAuthCode } from "./helpers/auth-code-generator";
import { Claims } from "./helpers/claims-config";
import {
  CodedError,
  handleErrors,
  successfulJsonResult,
} from "../helper/result-helper";
import { ROOT_URI } from "./data/auth-dummy-constants";

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

function get(event: APIGatewayProxyEvent): APIGatewayProxyResult {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Reached the ${event.httpMethod} endpoint`,
    }),
  };
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
  const passwordResetTime = parsedBody.passwordResetTime
    ? Number(parsedBody.passwordResetTime)
    : 10;

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

  const user = await getUserProfileByEmail(email);
  const claimsList = claims.claim ? JSON.parse(claims.claim) : [];
  const authCode = generateAuthCode();

  const authCodeResult: AuthCodeStoreInput = {
    authCode,
    subjectId: user.SubjectID,
    claims: claimsList,
    sectorIdentifier: parsedBody.sectorIdentifier,
    isNewAccount: parsedBody.isNewAccount === "true",
    passwordResetTime,
    hasBeenUsed: false,
  };

  try {
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
