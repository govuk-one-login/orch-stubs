import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { logger } from "../logger";
import { compactDecrypt, base64url, jwtVerify } from "jose";
import renderIPVAuthorize from "./render-ipv-authorize";
import { ROOT_URI } from "./data/ipv-dummy-constants";
import {
  CodedError,
  handleErrors,
  methodNotAllowedError,
  successfulHtmlResult,
  successfulJsonResult,
} from "../helper/result-helper";
import {
  getStateWithAuthCode,
  putStateWithAuthCode,
  putUserIdentityWithAuthCode,
} from "./service/dynamodb-form-response-service";
import { randomBytes } from "crypto";
import { UserIdentity } from "./interfaces/user-identity-interface";
import { getIpvPrivateKey, getOrchJwks } from "./helper/key-helpers";

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
  const requestObject = event.queryStringParameters["request"] as string;

  if (!requestObject) {
    throw new CodedError(400, "Request query string parameter not found");
  }

  const orchJwks = getOrchJwks();
  const ipvPrivateKey = await getIpvPrivateKey();

  const { plaintext } = await compactDecrypt(requestObject, ipvPrivateKey);
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

  const authCode = base64url.encode(randomBytes(32));
  try {
    await putStateWithAuthCode(authCode, payload.state as string);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  return successfulHtmlResult(
    200,
    renderIPVAuthorize(header, payload, authCode)
  );
}

async function post(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const redirectUri = `${ROOT_URI}/ipv-callback`;

  if (!event.body) {
    throw new CodedError(400, "Missing request body");
  }
  const parsedBody = Object.fromEntries(new URLSearchParams(event.body));
  const authCode = parsedBody["authCode"];
  const url = new URL(redirectUri);

  try {
    const state = await getStateWithAuthCode(authCode);
    if (state) {
      logger.info("state: " + state);
      url.searchParams.append("state", state);
    } else {
      logger.info("State not found or is not a string.");
    }
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  if (parsedBody.oAuthError) {
    url.searchParams.append("error", parsedBody.oAuthError);
    url.searchParams.append(
      "error_description",
      parsedBody.oAuthErrorDescription
    );
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

  const userIdentity = mapFormToUserIdentity(parsedBody);

  url.searchParams.append("code", authCode);

  try {
    await putUserIdentityWithAuthCode(authCode, userIdentity);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

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

const mapFormToUserIdentity = (form: { [k: string]: string }): UserIdentity => {
  const userIdentity: Record<string, unknown> = {};
  if (!form["identity_claim"] || form["identity_claim"].trim().length === 0) {
    throw new CodedError(
      400,
      "Invalid Request: Core Identity Claim is required"
    );
  }

  userIdentity["https://vocab.account.gov.uk/v1/coreIdentity"] =
    tryParseOrThrowError(form["identity_claim"], "identity_claim");

  const optionalClaims = {
    address_claim: "https://vocab.account.gov.uk/v1/address",
    driving_permit_claim: "https://vocab.account.gov.uk/v1/drivingPermit",
    nino_claim: "https://vocab.account.gov.uk/v1/socialSecurityRecord",
    passport_claim: "https://vocab.account.gov.uk/v1/passport",
    return_code_claim: "https://vocab.account.gov.uk/v1/returnCode",
  };

  Object.entries(optionalClaims).forEach(([field, val]) => {
    if (form[field]) {
      userIdentity[val] = tryParseOrThrowError(form[field], field);
    }
  });

  return {
    sub: form.sub,
    vot: form.vot,
    vtm: form.vtm,
    ...userIdentity,
  } as UserIdentity;
};

const tryParseOrThrowError = (claim: string, ClaimName: string) => {
  try {
    return JSON.parse(claim);
  } catch (error) {
    const errorMessage = `Invalid JSON parsing form claim: ${ClaimName} error: ${(error as Error).message}`;
    logger.error(error);
    throw new CodedError(400, `Invalid Request: ${errorMessage}`);
  }
};
