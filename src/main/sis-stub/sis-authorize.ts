import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import {
  CodedError,
  createHtmlResult,
  handleErrors,
  methodNotAllowedError,
} from "../helper/result-helper";
import { logger } from "../logger";
import { base64url, compactDecrypt, jwtVerify } from "jose";
import { randomBytes } from "crypto";
import { putStateWithAuthCode } from "../shared-identity/service/dynamodb-form-response-service";
import {
  getOrchJwks,
  getPrivateKey,
} from "../shared-identity/helper/key-helpers";
import renderSISAuthorize from "./render-sis-authorize";
import { handlePost } from "../shared-identity/helper/authorize-helpers";
import { ROOT_URI } from "../shared-identity/data/identity-dummy-constants";

const IDENTITY_STUB_NAME = "SisStub";

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
  logger.info("SIS Authorize GET endpoint invoked!");

  if (event.queryStringParameters == null) {
    throw new CodedError(400, "Query string parameters are null");
  }
  const requestObject = event.queryStringParameters.request!;

  if (!requestObject) {
    throw new CodedError(400, "Request query string parameter not found");
  }

  const orchJwks = getSisOrchJwks();
  const sisPrivateKey = await getSisPrivateKey();

  const { plaintext } = await compactDecrypt(requestObject, sisPrivateKey);
  const encodedJwt = new TextDecoder().decode(plaintext);

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
    await putStateWithAuthCode(
      IDENTITY_STUB_NAME,
      authCode,
      payload.state as string
    );
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }

  return createHtmlResult(200, renderSISAuthorize(header, payload, authCode));
}

async function post(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const redirectUri = `${ROOT_URI}/sis-callback`;
  const url = new URL(redirectUri);

  return handlePost(
    IDENTITY_STUB_NAME,
    event.body || undefined,
    url,
    handlePostErrors
  );
}

type OAuthError = {
  error: string;
  errorDescription: string;
};
const errors: Record<string, OAuthError> = {
  access_denied: {
    error: "access_denied",
    errorDescription: "record_unavailable",
  },
  update_identity: {
    error: "access_denied",
    errorDescription: "record_update_requested",
  },
  generic_error: {
    error: "server_error",
    errorDescription: "server_had_a_problem",
  },
};

const handlePostErrors = (
  parsedBody: Record<string, string>,
  url: URL
): URL | undefined => {
  if (parsedBody["oAuth-error"] !== "" && errors[parsedBody["oAuth-error"]]) {
    const oauthError = errors[parsedBody["oAuth-error"]];
    url.searchParams.append("error", oauthError.error);
    url.searchParams.append("error_description", oauthError.errorDescription);
    return url;
  }
};

const getSisOrchJwks = () => getOrchJwks("DUMMY_JWKS", "ORCH_SIS_JWKS_URL");
const getSisPrivateKey = () => getPrivateKey("SIS_PRIVATE_ENCRYPTION_KEY");
