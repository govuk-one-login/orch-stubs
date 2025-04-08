import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import {
  TokenStore,
  TokenStoreInput,
} from "../interfaces/token-store-interface";

const dynamoClient = new DynamoDBClient({
  region: "eu-west-2",
  ...(process.env.LOCALSTACK_ENDPOINT && {
    endpoint: process.env.LOCALSTACK_ENDPOINT,
  }),
});
const dynamo = DynamoDBDocument.from(dynamoClient);

const tableName = `${process.env.ENVIRONMENT}AuthStubToken`;

export const getTokenStore = async (token: string): Promise<TokenStore> => {
  const response = await dynamo.get({
    TableName: tableName,
    Key: { token: token },
  });
  return response.Item as TokenStore;
};

export const addTokenStore = async (tokenStore: TokenStoreInput) => {
  return await dynamo.put({
    TableName: tableName,
    Item: {
      token: tokenStore.token,
      subjectId: tokenStore.subjectId,
      claims: tokenStore.claims,
      sectorIdentifier: tokenStore.sectorIdentifier,
      isNewAccount: tokenStore.isNewAccount,
      passwordResetTime: tokenStore.passwordResetTime,
      ttl: threeMintuesFromNow(),
      hasBeenUsed: tokenStore.hasBeenUsed,
    },
  });
};

export const updateHasBeenUsedTokenStore = async (
  token: string,
  hasBeenUsed: boolean
) => {
  return await dynamo.update({
    TableName: tableName,
    Key: { token: token },
    UpdateExpression: "SET hasBeenUsed = :hasBeenUsed",
    ExpressionAttributeValues: {
      ":hasBeenUsed": hasBeenUsed,
    },
  });
};

function threeMintuesFromNow() {
  return Math.floor(Date.now() / 1000) + 180;
}
