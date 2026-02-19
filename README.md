# Performance and scaling stubs
These stubs are owned by Orchestration for performance and scaling testing purposes.

There are three stubs:
 - [Authentication](src/main/auth-stub/)
 - [IPV](src/main/ipv-stub/)
 - [Spot](src/main/spot-stub/) 

This will allow Orchestration to exercise different journeys, write Orchestration specific acceptance tests, execute Orchestration performance tests, and test IPV in lower environments.

#### Prerequisites

A version of SAM CLI (v1.130.0+) that supports Node.js version 22. See the AWS SAM CLI [installation guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).

#### Build

> To build all the stubs

```shell script
npm run build
```

#### Start

> To start all the stubs locally (requires Docker) 

```shell script
npm run build && npm run start:local
```

There may be requirements for each stub to run so check the README for each stub.

#### Clean Build

> To clean build the app (try if you encounter issues re-running build)

```shell script
npm run clean && npm run build
```

## Private and public keys

Private and public keys are be needed for decryption and signature validation.

In deployed environments, keys are stored in KMS , secrets manager and parameter store.

For testing and local development there are some keys generated and commited to code in `parameters.json`

## Formatting and Linting

### Scripts

> To check

```shell script
npm run check; # Check all
npm run check:lint; # Check linting
npm run check:prettier; # Check prettier
```

> To fix formatting/linting
> 
```shell script
npm run fix; # Fix all
npm run fix:lint; # Fix linting
npm run fix:prettier; # Fix prettier
```

### Test

The easiest way to run all of the tests is to first stand up the local API with

```shell
npm run start:local:warm
```
then in a separate terminal run
```shell
npm run test:ci
```
This will spin up localstack and run both unit and integration tests, reporting coverage.
This is what runs in GitHub actions against PRs.

#### Unit tests

Unit test live in each of stub folders. Run all unit tests with

```shell
npm run test:unit
```
or specify with stub's unit test you want to run with

```shell
npm run test:unit:{stub}
```

#### Integration tests
You can run just the integration tests with 

```shell
npm run test:localstack:integration
```

To run the integration tests repeatedly, it may be faster to stand up localstack with 

```shell
npm run localstack:up
```

then run the tests as many times as needed with 

```shell
npm run test:integration
```

and finally tear down localstack with

```shell
npm run localstack:down
```