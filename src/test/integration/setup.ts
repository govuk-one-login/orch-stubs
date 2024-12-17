import localParams from "./../../../parameters.json";

Object.entries(localParams.Parameters)
  // Ignore the sam local localstack endpoint
  //for running the tests
  .filter(([k]) => k !== "LOCALSTACK_ENDPOINT")
  .forEach(([k, v]) => (process.env[k] = v));

const queuename = "local-queue";
process.env.QUEUE_NAME = queuename;
process.env.LOCALSTACK_ENDPOINT = "http://127.0.0.1:4566";
process.env.DESTINATION_QUEUE_URL = `http://127.0.0.1:4566/000000000000/${queuename}`;
process.env.AWS_REGION = "eu-west-2";
process.env.AWS_ACCESS_KEY_ID = "test-key";
process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
