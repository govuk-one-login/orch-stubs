import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { AuthCodeStoreInput } from "./interfaces/auth-code-store-interface";
import { addAuthCodeStore } from "./service/auth-code-dynamodb-service";
import {
  BadRequestError,
  CodedError,
  QueryParamsError,
} from "./helpers/errors";
import { getUserProfile } from "./services/user-profile-dynamodb-service";
import { getOrchToAuthExpectedClientId } from "./helpers/config";
import { decrypt } from "./helpers/decryption-helper";
import { validateClaims } from "./helpers/jwt-helper";
import { generateAuthCode } from "./helpers/auth-code-generator";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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
  console.log("I'm going to save the form to the database!");

  if (!event.body) {
    throw new CodedError(400, "Missing request body");
  }
  const parsedBody = Object.fromEntries(new URLSearchParams(event.body));
  const clientId = parsedBody["client_id"];
  const responseType = parsedBody["response_type"];

  try {
    validateQueryParams(clientId, responseType);
    const encryptedAuthRequestJWE = parsedBody["request"];
    const authRequestJweDecryptedAsJwt = await decrypt(encryptedAuthRequestJWE);
    await validateClaims(authRequestJweDecryptedAsJwt);
  } catch (error) {
    throw new BadRequestError(
      error instanceof Error ? error.message : "Unknown error."
    );
  }

  const user = await getUserProfile("dummy.email@email.com");

  const identityRequired = true; // TODO: get all from config page
  const amScopePresent = true;
  const govukAccountScopePresent = true;
  const phoneScopePresent = true;
  const emailScopePresent = true;

  const claimsSet = new Set<string>();
  claimsSet.add("email");
  claimsSet.add("local_account_id");
  claimsSet.add("verified_mfa_method_type");
  claimsSet.add("current_credential_strength");
  claimsSet.add("uplift_required");

  if (identityRequired) {
    claimsSet.add("salt");
    claimsSet.add("email_verified");
    claimsSet.add("phone_number");
  }

  if (amScopePresent) {
    claimsSet.add("public_subject_id");
  }

  if (govukAccountScopePresent) {
    claimsSet.add("legacy_subject_id");
  }

  if (phoneScopePresent) {
    claimsSet.add("phone_number");
    claimsSet.add("phone_number_verified");
  }

  if (emailScopePresent) {
    claimsSet.add("email_verified");
  }

  const authCodeResult: AuthCodeStoreInput = {
    authCode: generateAuthCode(),
    subjectId: user.SubjectID,
    claims: Array.from(claimsSet),
    sectorIdentifier: parsedBody.sectorIdentifier as string,
    isNewAccount: parsedBody.isNewAccount === "true",
    passwordResetTime: Number(parsedBody.passwordResetTime),
    hasBeenUsed: false,
  };

  try {
    await addAuthCodeStore(authCodeResult);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Reached the ${event.httpMethod} endpoint - this will return 302`,
    }),
  };
}

function validateQueryParams(clientId: string, responseType: string) {
  if (responseType == null) {
    throw new QueryParamsError("Response type is not set");
  }
  if (clientId !== getOrchToAuthExpectedClientId()) {
    throw new QueryParamsError("Client ID value is incorrect");
  }
}
