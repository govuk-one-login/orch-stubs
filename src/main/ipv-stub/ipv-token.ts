import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import * as querystring from "node:querystring";
import { jwtVerify } from "jose";
import * as process from "node:process";
import { IpvTokenResponse } from "./entity/ipv-token-response";
import { createPublicKey } from "node:crypto";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  switch (event.httpMethod) {
    case "POST":
      return await postAsync(event);
    default:
      return {
        statusCode: 405,
        body: JSON.stringify({
          message: "Method not allowed",
        }),
      };
  }
};

async function postAsync(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  let clientAssertionJwt: string;
  try {
    // validateHeadersOrThrow(event.headers)
    const body = getValidBodyOrThrow(event.body);
    clientAssertionJwt = body["client_assertion"] as string;
  } catch (e) {
    if (e instanceof Error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: e.message,
        }),
      };
    } else {
      throw e;
    }
  }

  const publicKey = createPublicKey(process.env.IPV_TOKEN_PUBLIC_KEY as string);

  try {
    await jwtVerify(clientAssertionJwt, publicKey, {
      audience: process.env.AUTH_FRONTEND_BASE_URL,
      subject: "authOrchestrator",
      issuer: "authOrchestrator",
    });
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to verify JWT",
      }),
    };
  }

  return {
    statusCode: 302,
    body: JSON.stringify(generateToken()),
  };
}

// function validateHeadersOrThrow(headers: APIGatewayProxyEventHeaders) : void {
//   if (headers["Content-type"] != "application/x-www-form-urlencoded; charset=UTF-8") {
//     throw new Error(`Unexpected content type header ${headers["content-type"]}`);
//   }
// }

function getValidBodyOrThrow(body: string | null): querystring.ParsedUrlQuery {
  if (body == null) {
    throw new Error("Missing request body");
  }

  const query = querystring.parse(body);

  const grantType = query["grant_type"];
  if (grantType != "authorization_code") {
    throw new Error("Unexpected grant type (" + grantType + ") in query");
  }

  const clientAssertionType = query["client_assertion_type"];
  if (
    clientAssertionType !=
    "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
  ) {
    throw new Error(
      "Unexpected client assertion type (" + clientAssertionType + ") in query"
    );
  }

  const authCode = query["code"];
  if (!(typeof authCode == "string") || authCode == "") {
    throw new Error("Unexpected auth code (" + authCode + ") in query");
  }

  const clientAssertion = query["client_assertion"];
  if (!(typeof clientAssertion == "string") || clientAssertion == "") {
    throw new Error(
      "Unexpected client assertion (" + clientAssertion + ") in query"
    );
  }

  const resource = query["resource"];
  if (
    !(typeof resource == "string") ||
    resource == "" ||
    !resource.endsWith("token")
  ) {
    throw new Error("Unexpected resource (" + resource + ") in query");
  }

  const clientId = query["client_id"];
  if (clientId != "authOrchestrator") {
    throw new Error("Unexpected client ID (" + clientId + ") in query");
  }

  return query;
}

function generateToken(): IpvTokenResponse {
  return {
    access_token: crypto.randomUUID(),
    token_type: "Bearer",
    expires_in: 3600,
  };
}
