import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventHeaders,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { logger } from "../logger";
import { importPKCS8, compactDecrypt } from "jose";
import renderIPVAuthorize from "./render-ipv-authorize";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  switch (event.httpMethod) {
    case "GET":
      return get(event);
    case "POST":
      return post(event);
    default:
      return errorResponse(405, "Method not allowed");
  }
};

async function get(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.info("IPV Authorize GET endpoint invoked");

  const headers: APIGatewayProxyEventHeaders = event.headers;
  const bearerToken = headers["Authorization"];
  if (!bearerToken) {
    return errorResponse(400, "Bearer token not found");
  }
  const encryptedJwt = bearerToken.split(" ")[1];

  const ipvPrivateKeyPem = process.env.IPV_PRIVATE_ENCRYPTION_KEY;
  if (!ipvPrivateKeyPem) {
    return errorResponse(500, "Private key not found");
  }
  const privateKey = await importPKCS8(ipvPrivateKeyPem, "RSA-OAEP-256");

  let encodedJwt = "";
  try {
    const { plaintext } = await compactDecrypt(encryptedJwt, privateKey);
    encodedJwt = plaintext.toString();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(500, "Decryption failed: " + message);
  }

  const parts = encodedJwt.split(".");
  if (parts.length !== 3) {
    return errorResponse(400, "Decrypted JWT is in invalid format");
  }

  let decodedHeader, decodedPayload, _decodedSignature;
  try {
    [decodedHeader, decodedPayload, _decodedSignature] = parts.map((part) =>
      Buffer.from(part, "base64url").toString("utf8")
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(500, "Decoding failed: " + message);
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: renderIPVAuthorize(decodedHeader, decodedPayload),
  };
}
function errorResponse(
  statusCode: number,
  message: string
): Promise<APIGatewayProxyResult> {
  logger.error(message);
  const result: APIGatewayProxyResult = {
    statusCode: statusCode,
    body: JSON.stringify({
      message: message,
    }),
  };
  return Promise.resolve(result);
}

function post(_event: APIGatewayProxyEvent): APIGatewayProxyResult {
  logger.info("I'm going to save the form to the database");

  const redirectUri = "https://oidc.sandpit.account.gov.uk/ipv-callback";
  const authCode = "12345";

  const url = new URL(redirectUri);
  url.searchParams.append("code", authCode);

  return {
    statusCode: 302,
    headers: {
      Location: url.toString(),
    },
    body: JSON.stringify({
      message: `Redirecting to ${url.toString()}`,
    }),
  };
}
