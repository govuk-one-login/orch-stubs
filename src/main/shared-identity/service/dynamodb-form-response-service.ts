import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { UserIdentity } from "../interfaces/user-identity-interface.ts";
import { warmSimpleKeyTable } from "../../util/dynamo-table-initialiser.ts";

const dynamoClient = new DynamoDBClient({
  region: "eu-west-2",
  ...(process.env.DYNAMO_ENDPOINT && {
    endpoint: process.env.DYNAMO_ENDPOINT,
  }),
});
const dynamo = DynamoDBDocument.from(dynamoClient);

const tableName = (identityStub?: string) =>
  `${process.env.ENVIRONMENT}-${identityStub ?? process.env.IDENTITY_STUB}-UserIdentity`;

const primaryKey = "UserIdentityId";

export const warmUp = async (): Promise<void> =>
  warmSimpleKeyTable(dynamoClient, tableName(), primaryKey);

export const getUserIdentityWithAuthCode = async (
  identityStub: string,
  authCode: string
): Promise<UserIdentity | null> => {
  const response = await dynamo.get({
    TableName: tableName(identityStub),
    Key: { UserIdentityId: authCode },
  });
  if (response.Item) {
    if (response.Item.ttl > Math.floor(Date.now() / 1000)) {
      return response.Item.userIdentity as UserIdentity;
    }
  }
  return null;
};

export const putUserIdentityWithAuthCode = async (
  identityStub: string,
  authCode: string,
  userIdentity: UserIdentity
) => {
  return await dynamo.put({
    TableName: tableName(identityStub),
    Item: {
      UserIdentityId: authCode,
      userIdentity,
      ttl: oneHourFromNow(),
    },
  });
};

export const getUserIdentityWithToken = async (
  identityStub: string,
  token: string
): Promise<UserIdentity | null> => {
  const response = await dynamo.get({
    TableName: tableName(identityStub),
    Key: { UserIdentityId: token },
  });
  if (response.Item) {
    if (response.Item.ttl > Math.floor(Date.now() / 1000)) {
      return response.Item.userIdentity as unknown as UserIdentity;
    }
  }
  return null;
};

export const putUserIdentityWithToken = async (
  identityStub: string,
  token: string,
  userIdentity: UserIdentity
) => {
  return await dynamo.put({
    TableName: tableName(identityStub),
    Item: {
      UserIdentityId: token,
      userIdentity,
      ttl: oneHourFromNow(),
    },
  });
};

export const getStateWithAuthCode = async (
  identityStub: string,
  authCode: string
): Promise<string> => {
  const response = await dynamo.get({
    TableName: tableName(identityStub),
    Key: { UserIdentityId: authCode + "-state" },
  });

  return response.Item?.state;
};

export const putStateWithAuthCode = async (
  identityStub: string,
  authCode: string,
  state: string
) => {
  return await dynamo.put({
    TableName: tableName(identityStub),
    Item: {
      UserIdentityId: authCode + "-state",
      state,
      ttl: oneHourFromNow(),
    },
  });
};

function oneHourFromNow() {
  return Math.floor(Date.now() / 1000) + 3600;
}
