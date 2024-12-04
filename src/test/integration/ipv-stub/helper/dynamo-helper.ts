import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { StateEntry, TableEntry, UserIdentityEntry } from "./table-entries";
import {
  getClientConfig,
  userIdentityTableName,
} from "../../../../main/aws-config";

const dynamoClient = new DynamoDBClient(getClientConfig());
const dynamoDoc = DynamoDBDocument.from(dynamoClient);

export async function createUserIdentityTable(): Promise<void> {
  const createTableCommand = new CreateTableCommand({
    TableName: userIdentityTableName,
    KeySchema: [
      {
        AttributeName: "UserIdentityId",
        KeyType: "HASH",
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: "UserIdentityId",
        AttributeType: "S",
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
  });

  try {
    await dynamoClient.send(createTableCommand);
  } catch {
    // table may already exist - try resetting it
    await resetUserIdentityTable();
  }
}

export async function resetUserIdentityTable() {
  const result = await dynamoDoc.scan({
    TableName: userIdentityTableName,
    ConsistentRead: true,
  });

  if (result.Items) {
    for (const item of result.Items) {
      await dynamoDoc.delete({
        TableName: userIdentityTableName,
        Key: {
          UserIdentityId: (item as TableEntry).UserIdentityId,
        },
      });
    }
  }
}

export async function putUserIdentity(
  userIdentityId: string,
  userIdentity: object
): Promise<void> {
  const userIdentityEntry: UserIdentityEntry = {
    UserIdentityId: userIdentityId,
    userIdentity: userIdentity,
    ttl: Math.floor(Date.now() / 1000) + 3600,
  };
  await dynamoDoc.put({
    TableName: userIdentityTableName,
    Item: userIdentityEntry,
  });
}

export async function getUserIdentity(userIdentityId: string): Promise<object> {
  const result = await dynamoDoc.get({
    TableName: userIdentityTableName,
    Key: { UserIdentityId: userIdentityId },
    ConsistentRead: true,
  });

  const { userIdentity } = result.Item as UserIdentityEntry;

  return userIdentity;
}

export async function putState(
  userIdentityId: string,
  state: string
): Promise<void> {
  const stateEntry: StateEntry = {
    UserIdentityId: `${userIdentityId}-state`,
    state: state,
  };
  await dynamoDoc.put({
    TableName: userIdentityTableName,
    Item: stateEntry,
  });
}

export async function getState(userIdentityId: string): Promise<string> {
  const result = await dynamoDoc.get({
    TableName: userIdentityTableName,
    Key: { UserIdentityId: `${userIdentityId}-state` },
    ConsistentRead: true,
  });

  const { state } = result.Item as StateEntry;

  return state;
}
