const queuename = "local-queue";
process.env.QUEUE_NAME = queuename;
process.env.LOCALSTACK_ENDPOINT = "http://localhost:4566";
process.env.DESTINATION_QUEUE_URL = `http://localhost:4566/000000000000/${queuename}`;
