/* eslint-disable  @typescript-eslint/no-explicit-any */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "eu-west-2",
  ...(process.env.DYNAMO_ENDPOINT && {
    endpoint: process.env.DYNAMO_ENDPOINT,
  }),
});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.TABLE_NAME ?? "local-OidcStore";

export class DynamoAdapter {
  private model: string;
  constructor(name: string) {
    this.model = name;
  }

  key(id: string) {
    return `${this.model}#${id}`;
  }

  async upsert(id: any, payload: any, expiresIn: any) {
    const expiresAt = expiresIn
      ? Math.floor(Date.now() / 1000) + expiresIn
      : undefined;

    const item = {
      PK: this.key(id),
      payload,
      ...(expiresAt && { expiresAt }),
      ...(payload.grantId && { grantId: payload.grantId }),
      ...(payload.uid && { uid: payload.uid }),
      ...(payload.userCode && { userCode: payload.userCode }),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );
  }

  // Retrieves a model by its primary key
  async find(id: any) {
    const res = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: this.key(id) },
      })
    );

    return this.parseResult(res.Item);
  }

  async findByUid(uid: any) {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI-2",
        KeyConditionExpression: "uid = :uid",
        ExpressionAttributeValues: { ":uid": uid },
      })
    );

    return this.parseResult(res.Items?.[0]);
  }

  async findByUserCode(userCode: any) {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI-3",
        KeyConditionExpression: "userCode = :userCode",
        ExpressionAttributeValues: { ":userCode": userCode },
      })
    );

    return this.parseResult(res.Items?.[0]);
  }

  async destroy(id: any) {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: this.key(id) },
      })
    );
  }

  async consume(id: any) {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: this.key(id) },
        UpdateExpression: "SET #payload.#consumed = :consumed",
        ExpressionAttributeNames: {
          "#payload": "payload",
          "#consumed": "consumed",
        },
        ExpressionAttributeValues: {
          ":consumed": Math.floor(Date.now() / 1000),
        },
      })
    );
  }

  async revokeByGrantId(grantId: any) {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI-1",
        KeyConditionExpression: "grantId = :grantId",
        ExpressionAttributeValues: { ":grantId": grantId },
      })
    );

    if (!res.Items || res.Items.length === 0) return;

    const chunks = [];
    for (let i = 0; i < res.Items.length; i += 25) {
      chunks.push(res.Items.slice(i, i + 25));
    }

    for (const chunk of chunks) {
      const deleteRequests = chunk.map((item) => ({
        DeleteRequest: { Key: { PK: item.PK } },
      }));

      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: deleteRequests,
          },
        })
      );
    }
  }

  parseResult(item: any) {
    if (!item) return undefined;

    if (item.expiresAt && item.expiresAt < Math.floor(Date.now() / 1000)) {
      return undefined;
    }

    return item.payload;
  }
}
