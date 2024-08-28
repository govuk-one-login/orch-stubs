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
} from "./helper/result-helper";
import { getUserIdentityWithToken } from "./service/dynamodb-form-response-service";

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

  try {
    const userIdentity = await getUserIdentityWithToken(accessToken);
    return Promise.resolve(successfulJsonResult(200, userIdentity));
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }
}

function getTokenOrThrow(headers: APIGatewayProxyEventHeaders): string {
  const accessToken = headers["Authorization"];
  if (!accessToken) {
    throw new CodedError(400, "Access Token does not exist");
  }
  return accessToken;
}
