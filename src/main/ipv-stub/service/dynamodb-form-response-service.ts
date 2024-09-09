import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { UserIdentity } from "../interfaces/user-identity-interface";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocument.from(client);

const tableName = `${process.env.ENVIRONMENT}-UserIdentity`;

export const getUserIdentityWithAuthCode = async (
  authCode: string
): Promise<UserIdentity> => {
  const userIdentity = await dynamo.get({
    TableName: tableName,
    Key: { UserIdentityId: authCode },
  });
  return userIdentity.Item as unknown as UserIdentity;
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
      ttl: getOneDayTimestamp(),
    },
  });
};

export const getUserIdentityWithToken = async (
  token: string
): Promise<UserIdentity> => {
  const userIdentity = await dynamo.get({
    TableName: tableName,
    Key: { UserIdentityId: token },
  });
  return userIdentity.Item as unknown as UserIdentity;
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
      ttl: getOneDayTimestamp(),
    },
  });
};

export const getStateWithAuthCode = async (
  authCode: string
): Promise<string> => {
  const result = await dynamo.get({
    TableName: tableName,
    Key: { UserIdentityId: authCode + "-state" },
  });

  return result.Item?.state;
};

export const putStateWithAuthCode = async (authCode: string, state: string) => {
  return await dynamo.put({
    TableName: tableName,
    Item: {
      UserIdentityId: authCode + "-state",
      state,
      ttl: getOneDayTimestamp(),
    },
  });
};

function getOneDayTimestamp() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return Math.floor(date.getTime() / 1000);
}
