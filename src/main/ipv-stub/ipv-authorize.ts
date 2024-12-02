import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { logger } from "../logger";
import { compactDecrypt, base64url, jwtVerify } from "jose";
import renderIPVAuthorize from "./render-ipv-authorize";
import { ROOT_URI, USER_IDENTITY } from "./data/ipv-dummy-constants";
import {
  CodedError,
  handleErrors,
  methodNotAllowedError,
  successfulHtmlResult,
  successfulJsonResult,
} from "./helper/result-helper";
import {
  getStateWithAuthCode,
  putStateWithAuthCode,
  putUserIdentityWithAuthCode,
} from "./service/dynamodb-form-response-service";
import { randomBytes } from "crypto";
import { UserIdentity } from "./interfaces/user-identity-interface";
import {
  getIpvPrivateKey,
  getOrchPublicSigningKey,
} from "./helper/key-helpers";

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

  const orchPublicSigningKey = await getOrchPublicSigningKey();
  const ipvPrivateKey = await getIpvPrivateKey();

  const { plaintext } = await compactDecrypt(requestObject, ipvPrivateKey);
  const encodedJwt = plaintext.toString();

  const parts = encodedJwt.split(".");
  if (parts.length !== 3) {
    throw new CodedError(400, "Decrypted JWT is in invalid format");
  }

  const jwt = await jwtVerify(encodedJwt, orchPublicSigningKey);

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

  if (event.body == null) {
    throw new CodedError(400, "Missing request body");
  }
  const parsedBody = event.body
    ? Object.fromEntries(new URLSearchParams(event.body))
    : {};
  const authCode = parsedBody["authCode"];
  const userIdentity = mapFormToUserIdentity(parsedBody);

  const url = new URL(redirectUri);
  url.searchParams.append("code", authCode);

  try {
    await putUserIdentityWithAuthCode(authCode, userIdentity);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

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

  return Promise.resolve(
    successfulJsonResult(
      302,
      {
        message: `Redirecting to ${url.toString()}`,
      },
      {
        Location: url.toString(),
      }
    )
  );
}

function mapFormToUserIdentity(form: { [k: string]: string }): UserIdentity {
  const claims = [
    "identity_claim",
    "address_claim",
    "driving_permit_claim",
    "nino_claim",
    "passport_claim",
    "return_code_claim",
  ];
  const parsedClaims = Object.fromEntries(
    claims.map((claim) => [claim, JSON.parse(form[claim])])
  );
  return {
    sub: parsedClaims["identity_claim"]["sub"],
    vot: parsedClaims["identity_claim"]["vot"],
    vtm: parsedClaims["identity_claim"]["vtm"],
    "https://vocab.account.gov.uk/v1/credentialJWT":
      USER_IDENTITY["https://vocab.account.gov.uk/v1/credentialJWT"],
    "https://vocab.account.gov.uk/v1/coreIdentity":
      parsedClaims["identity_claim"]["vc"]["credentialSubject"],
    "https://vocab.account.gov.uk/v1/address": parsedClaims["address_claim"],
    "https://vocab.account.gov.uk/v1/drivingPermit":
      parsedClaims["driving_permit_claim"],
    "https://vocab.account.gov.uk/v1/socialSecurityRecord":
      parsedClaims["nino_claim"],
    "https://vocab.account.gov.uk/v1/passport": parsedClaims["passport_claim"],
    "https://vocab.account.gov.uk/v1/returnCode":
      parsedClaims["return_code_claim"],
  };
}
