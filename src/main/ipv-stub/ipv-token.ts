import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import {
  deleteUserIdentityWithAuthCode,
  getUserIdentityWithAuthCode,
  putUserIdentityWithToken,
} from "./service/dynamodb-form-response-service";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  switch (event.httpMethod) {
    case "GET":
      return get(event);
    default:
      return {
        statusCode: 405,
        body: JSON.stringify({
          message: "Method not allowed",
        }),
      };
  }
};

async function get(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const authCode = JSON.parse(event.body as string)["authCode"];
  const userIdentity = await getUserIdentityWithAuthCode(authCode);
  putUserIdentityWithToken("test-token", userIdentity);
  deleteUserIdentityWithAuthCode(authCode);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Reached the ${event.httpMethod} endpoint`,
    }),
  };
}
