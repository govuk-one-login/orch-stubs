import localParams from "./../../../parameters.json" with { type: "json" };

const waitForLocalStack = async () => {
  let polls = 0;

  do {
    try {
      const res = await fetch("http://127.0.0.1:4566/_localstack/health");

      if (res.ok && res.status === 200) {
        break;
      }
    } catch (err) {
      console.error((err as Error).message);
    }

    polls++;

    await new Promise((r) => setTimeout(r, 500));
  } while (polls <= 20);

  if (polls >= 20) {
    throw new Error("Failed to start localstack");
  }
};

export default async () => {
  Object.entries(localParams.Parameters)
    // Ignore the localstack endpoints for running the tests
    .filter(([k]) => k !== "SQS_ENDPOINT" && k !== "DYNAMO_ENDPOINT")
    .forEach(([k, v]) => (process.env[k] = v));

  const queuename = "local-queue";
  process.env.QUEUE_NAME = queuename;
  process.env.DYNAMO_ENDPOINT = "http://127.0.0.1:4566";
  process.env.SQS_ENDPOINT = "http://127.0.0.1:4566";
  process.env.DESTINATION_QUEUE_URL = `http://127.0.0.1:4566/000000000000/${queuename}`;
  process.env.AWS_REGION = "eu-west-2";
  process.env.AWS_ACCESS_KEY_ID = "test-key";
  process.env.AWS_SECRET_ACCESS_KEY = "test-secret";

  await waitForLocalStack();
};
