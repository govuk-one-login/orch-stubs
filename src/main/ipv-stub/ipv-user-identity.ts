import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import {
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
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userIdentity = await getUserIdentityWithToken("TestToken");
    return Promise.resolve(successfulJsonResult(200, userIdentity));
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error,
      }),
    };
  }
}
