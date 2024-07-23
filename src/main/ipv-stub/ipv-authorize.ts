import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { logger } from "../logger";
import { renderPage } from "../template";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  switch (event.httpMethod) {
    case "GET":
      return get(event);
    case "POST":
      return post(event);
    default:
      logger.error("Method not allowed");
      return {
        statusCode: 405,
        body: JSON.stringify({
          message: "Method not allowed",
        }),
      };
  }
};

function get(_event: APIGatewayProxyEvent): APIGatewayProxyResult {
  logger.info("Reached the GET endpoint");
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: renderPage(
      `<h1 class="govuk-heading-l">Hello World from the IPV authorize lambda</h1>
  <p class="govuk-body">This page will show the decrypted JAR</p>
  <h4 class="govuk-body">This page will also contain the form to submit what you want for the IPV response. On submit it will send a POST request to the authorize lambda.</h4>
  <form action="" method="post">
    <button name="continue" value="continue" class="govuk-button">Continue</button>
  </form>`
    ),
  };
}

function post(event: APIGatewayProxyEvent): APIGatewayProxyResult {
  logger.info("I'm going to save the form to the database");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Reached the ${event.httpMethod} endpoint - this will return 302`,
    }),
  };
}
