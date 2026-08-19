import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventHeaders,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import querystring from "node:querystring";
import { base64url, jwtVerify } from "jose";
import {
  CodedError,
  handleErrors,
  methodNotAllowedError,
  createJsonResult,
} from "../../helper/result-helper.ts";
import {
  getUserIdentityWithAuthCode,
  putUserIdentityWithToken,
} from "../service/dynamodb-form-response-service.ts";
import { randomBytes } from "node:crypto";
import { logger } from "../../logger.ts";
import { getHeaderValueFromHeaders } from "../../util/request-header-helper.ts";
import { getOrchJwks } from "../helper/key-helpers.ts";

const createHandler = (
  jwksUrlEnvVar: string,
  identityStubName: string
): Handler => {
  return async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    return handleErrors(async () => {
      if (event.httpMethod === "POST") {
        return await post(event, jwksUrlEnvVar, identityStubName);
      } else {
        throw methodNotAllowedError(event.httpMethod);
      }
    });
  };
};

export const ipvTokenHandler: Handler = createHandler(
  "ORCH_IPV_JWKS_URL",
  "IpvStub"
);
export const sisTokenHandler: Handler = createHandler(
  "ORCH_SIS_JWKS_URL",
  "SisStub"
);

async function post(
  event: APIGatewayProxyEvent,
  jwksEnvVar: string,
  identityStubName: string
): Promise<APIGatewayProxyResult> {
  validateHeadersOrThrow(event.headers);
  const body = getValidBodyOrThrow(event.body);
  const clientAssertionJwt = body.client_assertion as string;
  try {
    await jwtVerify(clientAssertionJwt, getOrchJwks("DUMMY_JWKS", jwksEnvVar));
  } catch (error) {
    logger.error(
      `Failed to verify client_assertion from orchestration: ${(error as Error).message}`
    );
    throw new CodedError(500, "Invalid request");
  }

  const accessToken = base64url.encode(randomBytes(36));
  const authCode = body.code as string;
  let userIdentity;
  try {
    userIdentity = await getUserIdentityWithAuthCode(
      identityStubName,
      authCode
    );
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }
  if (userIdentity == null) {
    throw new CodedError(500, "Auth code not found in DB, or is expired");
  }
  await putUserIdentityWithToken(identityStubName, accessToken, userIdentity);
  return createJsonResult(200, {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
  });
}

function validateHeadersOrThrow(headers: APIGatewayProxyEventHeaders): void {
  const contentType = getHeaderValueFromHeaders(headers, "Content-Type");
  if (!contentType?.match(/x-www-form-urlencoded/)) {
    throw new CodedError(400, `Unexpected content type header ${contentType}`);
  }
}

function getValidBodyOrThrow(body: string | null): querystring.ParsedUrlQuery {
  if (body == null) {
    throw new CodedError(400, "Missing request body");
  }

  const query = querystring.parse(body);

  const grantType = query.grant_type;
  if (grantType != "authorization_code") {
    throw new CodedError(
      400,
      "Unexpected grant type (" + grantType + ") in query"
    );
  }

  const clientAssertionType = query.client_assertion_type;
  if (
    clientAssertionType !=
    "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
  ) {
    throw new CodedError(
      400,
      "Unexpected client assertion type (" + clientAssertionType + ") in query"
    );
  }

  const authCode = query.code;
  if (!authCode) {
    throw new CodedError(400, "Auth code query parameter is null or undefined");
  }

  const clientAssertion = query.client_assertion;
  if (typeof clientAssertion != "string" || clientAssertion == "") {
    throw new CodedError(
      400,
      "Unexpected client assertion (" + clientAssertion + ") in query"
    );
  }

  const clientId = query.client_id;
  if (clientId != "authOrchestrator") {
    throw new CodedError(
      400,
      "Unexpected client ID (" + clientId + ") in query"
    );
  }

  return query;
}
