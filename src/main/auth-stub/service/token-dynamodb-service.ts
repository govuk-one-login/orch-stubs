import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { TokenStore } from "../interfaces/token-store-interface";

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
    Key: { Token: token },
  });
  return response.Item as TokenStore;
};

export const addTokenStore = async (tokenStore: TokenStore) => {
  return await dynamo.put({
    TableName: tableName,
    Item: {
      AuthCode: tokenStore.token,
      SubjectId: tokenStore.subjectId,
      Claims: tokenStore.claims,
      SectorIdentifier: tokenStore.sectorIdentifier,
      IsNewAccount: tokenStore.isNewAccount,
      PasswordResetTime: tokenStore.passwordResetTime,
      Ttl: threeMintuesFromNow(),
      HasBeenUsed: tokenStore.hasBeenUsed,
    },
  });
};

export const updateHasBeenUsedTokenStore = async (
  token: string,
  hasBeenUsed: boolean
) => {
  return await dynamo.update({
    TableName: tableName,
    Key: { Token: token },
    UpdateExpression: "SET HasBeenUsed = :HasBeenUsed",
    ExpressionAttributeValues: {
      ":HasBeenUsed": hasBeenUsed,
    },
  });
};

function threeMintuesFromNow() {
  return Math.floor(Date.now() / 1000) + 180;
}
