import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventHeaders,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { logger } from "../logger";
import { importPKCS8, compactDecrypt } from "jose";
import renderIPVAuthorize from "./render-ipv-authorize";
import { AUTH_CODE, USER_IDENTITY } from "./data/ipv-dummy-constants";
import {
  CodedError,
  handleErrors,
  methodNotAllowedError,
  successfulHtmlResult,
  successfulJsonResult,
} from "./helper/result-helper";
import { putUserIdentityWithAuthCode } from "./service/dynamodb-form-response-service";

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
  logger.info("IPV Authorize GET endpoint invoked");

  const headers: APIGatewayProxyEventHeaders = event.headers;
  const bearerToken = headers["Authorization"];
  if (!bearerToken) {
    throw new CodedError(400, "Bearer token not found");
  }
  const encryptedJwt = bearerToken.split(" ")[1];

  const ipvPrivateKeyPem = process.env.IPV_AUTHORIZE_PRIVATE_ENCRYPTION_KEY;
  if (!ipvPrivateKeyPem) {
    throw new CodedError(500, "Private key not found");
  }
  const privateKey = await importPKCS8(ipvPrivateKeyPem, "RSA-OAEP-256");

  const { plaintext } = await compactDecrypt(encryptedJwt, privateKey);
  const encodedJwt = plaintext.toString();

  const parts = encodedJwt.split(".");
  if (parts.length !== 3) {
    throw new CodedError(400, "Decrypted JWT is in invalid format");
  }

  const [decodedHeader, decodedPayload, _decodedSignature] = parts.map((part) =>
    Buffer.from(part, "base64url").toString("utf8")
  );

  return successfulHtmlResult(
    200,
    renderIPVAuthorize(decodedHeader, decodedPayload)
  );
}

async function post(
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const redirectUri = "https://oidc.sandpit.account.gov.uk/ipv-callback";

  const url = new URL(redirectUri);
  url.searchParams.append("code", AUTH_CODE);

  try {
    await putUserIdentityWithAuthCode("AuthCode", USER_IDENTITY);
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
