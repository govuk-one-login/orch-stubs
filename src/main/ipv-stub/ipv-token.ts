import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventHeaders,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import querystring from "node:querystring";
import { base64url, importSPKI, jwtVerify } from "jose";
import {
  CodedError,
  handleErrors,
  methodNotAllowedError,
  successfulJsonResult,
} from "./helper/result-helper";
import {
  getUserIdentityWithAuthCode,
  putUserIdentityWithToken,
} from "./service/dynamodb-form-response-service";
import { randomBytes } from "crypto";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return handleErrors(async () => {
    switch (event.httpMethod) {
      case "POST":
        return await post(event);
      default:
        throw methodNotAllowedError(event.httpMethod);
    }
  });
};

async function post(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  validateHeadersOrThrow(event.headers);
  const body = getValidBodyOrThrow(event.body);
  const clientAssertionJwt = body["client_assertion"] as string;

  const publicKey = await importSPKI(
    process.env.IPV_TOKEN_PUBLIC_SIGNING_KEY as string,
    "ES256"
  );

  try {
    await jwtVerify(clientAssertionJwt, publicKey);
  } catch (error) {
    if (error instanceof Error) {
      throw new CodedError(500, "Failed to verify JWT: " + error.message);
    }

    throw error;
  }

  const accessToken = base64url.encode(randomBytes(36));
  const authCode = body["code"] as string;
  let userIdentity;
  try {
    userIdentity = await getUserIdentityWithAuthCode(authCode);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }
  if (userIdentity == null) {
    throw new CodedError(500, "Auth code not found in DB, or is expired");
  }
  await putUserIdentityWithToken(accessToken, userIdentity);
  return successfulJsonResult(200, {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
  });
}

function validateHeadersOrThrow(headers: APIGatewayProxyEventHeaders): void {
  const contentType = headers["Content-Type"];
  if (!contentType?.match(/x-www-form-urlencoded/)) {
    throw new CodedError(400, `Unexpected content type header ${contentType}`);
  }
}

function getValidBodyOrThrow(body: string | null): querystring.ParsedUrlQuery {
  if (body == null) {
    throw new CodedError(400, "Missing request body");
  }

  const query = querystring.parse(body);

  const grantType = query["grant_type"];
  if (grantType != "authorization_code") {
    throw new CodedError(
      400,
      "Unexpected grant type (" + grantType + ") in query"
    );
  }

  const clientAssertionType = query["client_assertion_type"];
  if (
    clientAssertionType !=
    "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
  ) {
    throw new CodedError(
      400,
      "Unexpected client assertion type (" + clientAssertionType + ") in query"
    );
  }

  const authCode = query["code"];
  if (!authCode) {
    throw new CodedError(400, "Auth code query parameter is null or undefined");
  }

  const clientAssertion = query["client_assertion"];
  if (typeof clientAssertion != "string" || clientAssertion == "") {
    throw new CodedError(
      400,
      "Unexpected client assertion (" + clientAssertion + ") in query"
    );
  }

  const clientId = query["client_id"];
  if (clientId != "authOrchestrator") {
    throw new CodedError(
      400,
      "Unexpected client ID (" + clientId + ") in query"
    );
  }

  return query;
}
