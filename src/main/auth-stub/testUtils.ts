import { Context } from "aws-lambda";

export const mockLambdaContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: "testFunction",
  functionVersion: "testVersion",
  invokedFunctionArn: "testFunctionArn",
  memoryLimitInMB: "1",
  awsRequestId: "testRequestId",
  logGroupName: "testLogGroupName",
  logStreamName: "testLogStreamName",
  getRemainingTimeInMillis: () => 1,
  done: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn(),
};
