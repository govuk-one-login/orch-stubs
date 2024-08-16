import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { USER_IDEINTITY } from "./data/ipv-dummy-constants";
import {
  handleErrors,
  methodNotAllowedError,
  successfulJsonResult,
} from "./helper/result-helper";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return handleErrors(async () => {
    switch (event.httpMethod) {
      case "GET":
        return await get();
      default:
        throw methodNotAllowedError(event.httpMethod);
    }
  });
};

function get(): Promise<APIGatewayProxyResult> {
  return Promise.resolve(successfulJsonResult(200, USER_IDEINTITY));
}
