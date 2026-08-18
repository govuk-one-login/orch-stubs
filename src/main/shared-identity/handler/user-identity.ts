import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import {
  CodedError,
  handleErrors,
  methodNotAllowedError,
  createJsonResult,
} from "../../helper/result-helper.ts";
import { getUserIdentityWithToken } from "../service/dynamodb-form-response-service.ts";
import {
  getAccessTokenFromAuthorizationHeader,
  getHeaderValueFromHeaders,
} from "../../util/request-header-helper.ts";

export const createHandler = (identityStubName: string): Handler => {
  return async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    return handleErrors(async () => {
      if (event.httpMethod === "GET") {
        return await get(event, identityStubName);
      } else {
        throw methodNotAllowedError(event.httpMethod);
      }
    });
  };
};

export const ipvUserIdentityHandler: Handler = createHandler("IpvStub");
export const sisUserIdentityHandler: Handler = createHandler("SisStub");

async function get(
  event: APIGatewayProxyEvent,
  identityStubName: string
): Promise<APIGatewayProxyResult> {
  const authorizationHeader = getHeaderValueFromHeaders(
    event.headers,
    "Authorization"
  );

  if (!authorizationHeader) {
    return {
      statusCode: 401,
      body: "",
      multiValueHeaders: { "WWW-Authenticate": ["Bearer"] },
    };
  }

  const accessToken =
    getAccessTokenFromAuthorizationHeader(authorizationHeader);

  let userIdentity;
  try {
    userIdentity = await getUserIdentityWithToken(
      identityStubName,
      accessToken
    );
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }
  if (userIdentity == null) {
    throw new CodedError(500, "Access token not found in DB, or is expired");
  }
  return createJsonResult(200, userIdentity);
}
