const region = "eu-west-2";
const credentials = {
  accessKeyId: "dummy",
  secretAccessKey: "dummy",
};
const localstackPort = 4566;
const localhost = "http://localhost";
const dockerLocalhost = "http://host.docker.internal";
const testQueueName = "local-queue";
const isTest = process.env.ENVIRONMENT == "local";

export const userIdentityTableName = `${process.env.ENVIRONMENT}-IpvStub-UserIdentity`;
export const spotQueueName = isTest ? testQueueName : process.env.QUEUE_NAME;

function getLocalHost(useDocker: boolean) {
  return useDocker ? dockerLocalhost : localhost;
}

export function getSpotDestinationQueueUrl(useDocker: boolean) {
  return isTest
    ? `${getLocalEndpoint(useDocker)}000000000000/${testQueueName}`
    : process.env.DESTINATION_QUEUE_URL;
}

export function getLocalEndpoint(
  useDocker: boolean,
  port: number = localstackPort
) {
  return `${getLocalHost(useDocker)}:${port}/`;
}

export function getClientConfig(
  useDocker: boolean,
  port: number = localstackPort
) {
  return isTest
    ? {
        region,
        credentials,
        endpoint: getLocalEndpoint(useDocker, port),
      }
    : {};
}
