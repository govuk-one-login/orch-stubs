import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import {
  CodedError,
  handleErrors,
  methodNotAllowedError,
  successfulJsonResult,
} from "../helper/result-helper";
import { getUserIdentityWithToken } from "./service/dynamodb-form-response-service.ts";
import {
  getAccessTokenFromAuthorizationHeader,
  getHeaderValueFromHeaders,
} from "../util/request-header-helper.ts";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return handleErrors(async () => {
    switch (event.httpMethod) {
      case "GET":
        return await get(event);
      default:
        throw methodNotAllowedError(event.httpMethod);
    }
  });
};

async function get(
  event: APIGatewayProxyEvent
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
    userIdentity = await getUserIdentityWithToken(accessToken);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }
  if (userIdentity == null) {
    throw new CodedError(500, "Access token not found in DB, or is expired");
  }
  return successfulJsonResult(200, userIdentity);
}
