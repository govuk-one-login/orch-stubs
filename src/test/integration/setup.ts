const queuename = "local-queue";
process.env.QUEUE_NAME = queuename;
process.env.LOCALSTACK_ENDPOINT = "http://localhost:4566";
process.env.DESTINATION_QUEUE_URL = `http://localhost:4566/000000000000/${queuename}`;
process.env.AWS_REGION = "eu-west-2";
process.env.AWS_ACCESS_KEY_ID = "test-key";
process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
