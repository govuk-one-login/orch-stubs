# Performance and scaling stubs
These stubs are owned by Orchestration for performance and scaling testing purposes.

There will be three stubs - one for Authentication, one for IPV, and one for SPOT. This will allow Orchestration to exercise different journeys, write Orchestration specific acceptance tests, execute Orchestration performance tests, and test IPV in lower environments.

#### Prerequisites

A version of SAM CLI (v1.120.0+) that supports Node.js version 20. See the AWS SAM CLI [installation guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).

#### Build

> To build the app

```shell script
npm run build
```

#### Start

> To start the app locally (requires Docker)

```shell script
npm run build && npm run start:local
```

#### Clean Build

> To clean build the app (try if you encounter issues re-running build)

```shell script
npm run clean && npm run build
```

## Private and public keys

Private and public keys are be needed for decryption and signature validation.

The local private key (in _parameters.json_) has been commited deliberately. The key pair was generated fresh and should only be used for testing, both locally and as part of the pre-merge GitHub workflow.

In deployed environments, the private key will be retrieved from AWS Secrets Manager, and the public key from AWS Parameter Store. This key pair is different from the one which has been commited here.

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

> To run tests

```shell script
npm run test
```

> To run tests with coverage

```shell script
npm run test:coverage
```