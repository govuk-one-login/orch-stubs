import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { UserIdentity } from "../interfaces/user-identity-interface";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocument.from(client);

const tableName = `${process.env.ENVIRONMENT}-IpvStub-UserIdentity`;

export const getUserIdentityWithAuthCode = async (
  authCode: string
): Promise<UserIdentity> => {
  const response = await dynamo.get({
    TableName: tableName,
    Key: { UserIdentityId: authCode },
  });
  return response.Item?.userIdentity as unknown as UserIdentity;
};

export const putUserIdentityWithAuthCode = async (
  authCode: string,
  userIdentity: UserIdentity
) => {
  return await dynamo.put({
    TableName: tableName,
    Item: {
      UserIdentityId: authCode,
      userIdentity,
      ttl: oneHourFromNow(),
    },
  });
};

export const getUserIdentityWithToken = async (
  token: string
): Promise<UserIdentity | null> => {
  const response = await dynamo.get({
    TableName: tableName,
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
  token: string,
  userIdentity: UserIdentity
) => {
  return await dynamo.put({
    TableName: tableName,
    Item: {
      UserIdentityId: token,
      userIdentity,
      ttl: oneHourFromNow(),
    },
  });
};

export const getStateWithAuthCode = async (
  authCode: string
): Promise<string> => {
  const response = await dynamo.get({
    TableName: tableName,
    Key: { UserIdentityId: authCode + "-state" },
  });

  return response.Item?.state;
};

export const putStateWithAuthCode = async (authCode: string, state: string) => {
  return await dynamo.put({
    TableName: tableName,
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
