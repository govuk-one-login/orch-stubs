import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { UserIdentity } from "./interfaces/user-identity-interface";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  switch (event.httpMethod) {
    case "GET":
      return get();
    default:
      return {
        statusCode: 405,
        body: JSON.stringify({
          message: "Method not allowed",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      };
  }
};

function get(): APIGatewayProxyResult {
  return {
    statusCode: 200,
    body: JSON.stringify(exampleUserIdentity),
    headers: {
      "Content-Type": "application/json",
    },
  };
}
