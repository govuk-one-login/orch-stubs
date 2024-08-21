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
import { IpvTokenResponse } from "./interfaces/ipv-token-response-interface";

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
    const userIdentity = await getUserIdentityWithToken(
      accessToken.access_token
    );
    return Promise.resolve(successfulJsonResult(200, userIdentity));
  } catch (error) {
    throw new CodedError(500, `dynamoDb error: ${error}`);
  }
}

function getTokenOrThrow(
  headers: APIGatewayProxyEventHeaders
): IpvTokenResponse {
  const accessToken = headers["Authorization"] as unknown as IpvTokenResponse;
  if (!accessToken["access_token"]) {
    throw new CodedError(400, "Access Token does not exist");
  }
  return accessToken as unknown as IpvTokenResponse;
}
