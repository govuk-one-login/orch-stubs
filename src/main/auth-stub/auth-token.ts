import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import {
  addAuthCodeStore,
  getAuthCodeStore,
  updateHasBeenUsedAuthCodeStore,
} from "./service/auth-code-dynamodb-service";
import { AuthCodeStore } from "./interfaces/auth-code-store-interface";
import { logger } from "../logger";

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
  const dynamoTestObject = {
    authCode: "TEST1",
    subjectId: "testSubjectId",
    claims: ["testClaim"],
    sectorIdentifier: "testSectorId",
    isNewAccount: false,
    passwordResetTime: 10,
    hasBeenUsed: false,
  };
  logger.info("In the correct GET function");
  let data: AuthCodeStore;
  try {
    await addAuthCodeStore(dynamoTestObject);
    await updateHasBeenUsedAuthCodeStore(dynamoTestObject.authCode, true);
    data = await getAuthCodeStore(dynamoTestObject.authCode);
  } catch (error) {
    logger.error(`dynamoDb error: ${error}`);
    throw new Error(`dynamoDb error: ${error}`);
  }

  logger.info(`The TTL is ${data.ttl}`);
  logger.info(`The auth code is ${data.authCode}`);
  logger.info(`The data is ${data}`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Reached the ${event.httpMethod} endpoint`,
      data: data,
    }),
  };
}
