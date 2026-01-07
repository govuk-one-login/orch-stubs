### Testing with the RP stub

Setup to configure the RP stub to use the Auth stub:

- In the authentication-api repo, there is an `authStubEnabled` flag in the dev environment configuration. It's defaulted to `false`, but you can create a branch to toggle it to `true`, (or you can use [this branch](https://github.com/govuk-one-login/authentication-api/tree/refs/heads/ATO-1550/enable-auth-stub-in-dev)).

The `authStubEnabled` feature flag updates the URLs and encryption keys in orch to use the stub ones instead of the real auth ones.

This will allow you to test the Orch Auth stub with an Auth journey executed from the authdev3 RP stub.

### Testing locally

You can run the authstub locally for development purposes by following these steps:
- Start localstack using `npm localstack:up`
- Run the authstub locally using `npm start:local:auth` in the root of this project.
    - Note that sometimes if you make code changes, you need to force a rebuild using `npm clean:auth && npm:build:auth` for the changes to come through
- Generate a signed and encrypted JWT using `npm createAuthRequestObject`. It should output something along the lines of `Here's your request object: <JWE>`
    - This command points to the script here: `scripts/createAuthRequestObject.mjs`. You can update the claims set in the JWT there if needed.
- Make a request to `http://127.0.0.1:3001/authorize?client_id=orchestrationAuth&response_type=code&request=<JWE>`

After this you should be taken to the authstub page. Pressing submit should redirect you to a dead link ending in `orchestration-redirect`. 