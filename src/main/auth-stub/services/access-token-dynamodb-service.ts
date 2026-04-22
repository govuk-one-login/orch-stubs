import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import {
  AccessTokenStore,
  AccessTokenStoreInput,
} from "../interfaces/access-token-store-interface.ts";

const dynamoClient = new DynamoDBClient({
  region: "eu-west-2",
  ...(process.env.DYNAMO_ENDPOINT && {
    endpoint: process.env.DYNAMO_ENDPOINT,
  }),
});
const dynamo = DynamoDBDocument.from(dynamoClient);

const tableName = `${process.env.ENVIRONMENT}-AuthStub-AccessToken`;

export const warmUp = async (): Promise<void> => {
  try {
    await dynamoClient.send(
      new DescribeTableCommand({
        TableName: tableName,
      })
    );
  } catch (err) {
    if (
      err instanceof ResourceNotFoundException &&
      process.env.ENVIRONMENT === "local"
    ) {
      await dynamoClient.send(
        new CreateTableCommand({
          TableName: tableName,
          KeySchema: [
            {
              AttributeName: "accessToken",
              KeyType: "HASH",
            },
          ],
          AttributeDefinitions: [
            {
              AttributeName: "accessToken",
              AttributeType: "S",
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
        })
      );
    }
  }
};

export const getAccessTokenStore = async (
  accessToken: string
): Promise<AccessTokenStore> => {
  const response = await dynamo.get({
    TableName: tableName,
    Key: { accessToken: accessToken },
  });
  return response.Item as AccessTokenStore;
};

export const addAccessTokenStore = async (
  accessTokenStore: AccessTokenStoreInput
) => {
  return await dynamo.put({
    TableName: tableName,
    Item: {
      accessToken: accessTokenStore.accessToken,
      subjectId: accessTokenStore.subjectId,
      claims: accessTokenStore.claims,
      sectorIdentifier: accessTokenStore.sectorIdentifier,
      isNewAccount: accessTokenStore.isNewAccount,
      passwordResetTime: accessTokenStore.passwordResetTime,
      ttl: threeMintuesFromNow(),
      hasBeenUsed: accessTokenStore.hasBeenUsed,
    },
  });
};

export const updateHasBeenUsedAccessTokenStore = async (
  accessToken: string,
  hasBeenUsed: boolean
) => {
  return await dynamo.update({
    TableName: tableName,
    Key: { accessToken: accessToken },
    UpdateExpression: "SET hasBeenUsed = :hasBeenUsed",
    ExpressionAttributeValues: {
      ":hasBeenUsed": hasBeenUsed,
    },
  });
};

function threeMintuesFromNow() {
  return Math.floor(Date.now() / 1000) + 180;
}
