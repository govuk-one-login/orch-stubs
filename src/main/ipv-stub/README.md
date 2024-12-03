### Testing with the RP stub

Setup to configure the RP stub to use the IPV stub:

1. Deploy [this branch](https://github.com/govuk-one-login/authentication-api/tree/refs/heads/ATO-867/connect-orch-ipv-stub-to-rp-stub) to orch dev. This branch changes the IPV flags to allow the dev environment and also points the `IPV URLs` to the IPV stub.

2. Locate the client registry DynamoDB item for sandpit RP stub (ClientID `1Dlz5rYheTqzZASRMmSBtgFIYgZlysnQ`), and manually change the value of `IdentityVerificationSupported` from 0 to 1.

This will allow you to test the Orch IPV stub with an identity journey executed from the sandpit RP stub.

> **_NOTE:_** Testing with the sandpit RP stub will lead you to an error page and not the userinfo results as the SPOT stub has not yet been created. Check IPVCallbackHandler logs for more details.

## Running the stub locally

The IPV stub is able to be ran locally using localstack and sam local. To start the local stack container, which contains the dynamoDB table `local-IpvStub-UserIdentity`, run the following command:

```bash
npm run localstack:up
```

To run the local API Gateway with sam local, run the following:

```bash
npm run build:ipv && npm run start:local:ipv
```

Once this is done, you can then hit the `/authorize` endpoint with a valid request object. To create a valid request object you can run this command:

```bash
npm run createRequestObject
```

This will use the local keys in the `parameters.json` file to create a valid signed and encrypted request object. You can then run through the stub and be redirected to `https://oidc.local.account.gov.uk/ipv-callback` with an auth code
