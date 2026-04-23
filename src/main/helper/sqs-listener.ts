import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
  SQSClientConfig,
} from "@aws-sdk/client-sqs";
import {
  Context,
  SQSHandler,
  SQSRecord,
  SQSRecordAttributes,
} from "aws-lambda";

const sqsConfig: SQSClientConfig = process.env.SQS_ENDPOINT
  ? { endpoint: process.env.SQS_ENDPOINT }
  : {};
const sqsClient = new SQSClient(sqsConfig);

const sqsPoll = async (queueUrl: string): Promise<Message[] | undefined> => {
  const request = new ReceiveMessageCommand({
    QueueUrl: queueUrl,
    WaitTimeSeconds: 5,
  });
  const response = await sqsClient.send(request);
  return response.Messages;
};

const deleteMessage = async (
  queueUrl: string,
  receiptHandle: string
): Promise<void> => {
  const request = new DeleteMessageCommand({
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle,
  });
  await sqsClient.send(request);
};

const messageToRecord = (message: Message): SQSRecord => ({
  messageId: message.MessageId!,
  receiptHandle: message.ReceiptHandle!,
  body: message.Body!,
  attributes: message.Attributes as SQSRecordAttributes,
  // TODO: if we start using message attributes they need to be mapped properly
  messageAttributes: {},
  md5OfBody: message.MD5OfBody!,
  md5OfMessageAttributes: message.MD5OfMessageAttributes,
  eventSource: "aws:sqs",
  eventSourceARN: "arn:aws:sqs:local:example",
  awsRegion: "local",
});

export const startPoll = async (
  queueUrl: string,
  handler: SQSHandler
): Promise<() => void> => {
  let running = true;
  const shutdown = () => (running = false);

  (async () => {
    while (running) {
      const messages = await sqsPoll(queueUrl);
      if (messages) {
        await handler(
          { Records: messages.map(messageToRecord) },
          {} as Context,
          () => {}
        );
        for (const message of messages) {
          await deleteMessage(queueUrl, message.ReceiptHandle!);
        }
      }
    }
  })();

  return shutdown;
};
