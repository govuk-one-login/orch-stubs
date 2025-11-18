import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventHeaders,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import {
  CodedError,
  handleErrors,
  methodNotAllowedError,
  successfulJsonResult,
} from "../helper/result-helper.ts";
import { getUserIdentityWithToken } from "./service/dynamodb-form-response-service.ts";

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
  const accessToken = getTokenOrThrow(event.headers);

  let userIdentity;
  try {
    const tokenKey = accessToken.replace("Bearer ", "");
    userIdentity = await getUserIdentityWithToken(tokenKey);
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }
  if (userIdentity == null) {
    throw new CodedError(500, "Access token not found in DB, or is expired");
  }
  return Promise.resolve(successfulJsonResult(200, userIdentity));
}

function getTokenOrThrow(headers: APIGatewayProxyEventHeaders): string {
  const accessToken = headers["Authorization"];
  if (!accessToken) {
    throw new CodedError(400, "Access Token does not exist");
  }
  return accessToken;
}
