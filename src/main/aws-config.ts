const region = "eu-west-2";
const credentials = {
  accessKeyId: "dummy",
  secretAccessKey: "dummy",
};
const localstackPort = 4566;
const dockerLocalhost = "http://host.docker.internal";
const testQueueName = "local-queue";
const isTest = process.env.ENVIRONMENT == "local";

export const userIdentityTableName = `${process.env.ENVIRONMENT}-IpvStub-UserIdentity`;
export const spotQueueName = isTest ? testQueueName : process.env.QUEUE_NAME;
export const spotDestinationQueueUrl = isTest
  ? `${getLocalEndpoint()}000000000000/${testQueueName}`
  : process.env.DESTINATION_QUEUE_URL;

export function getLocalEndpoint(testPort: number = localstackPort) {
  return `${dockerLocalhost}:${testPort}/`;
}

export function getClientConfig(testEndpointPort: number = localstackPort) {
  return isTest
    ? {
        region,
        credentials,
        endpoint: getLocalEndpoint(testEndpointPort),
      }
    : {};
}
