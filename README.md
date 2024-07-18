# Performance and scaling stubs
These stubs are owned by Orchestration for performance and scaling testing purposes.

There will be three stubs - one for Authentication, one for IPV, and one for SPOT. This will allow Orchestration to exercise different journeys, write Orchestration specific acceptance tests, execute Orchestration performance tests, and test IPV in lower environments.

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

<br />

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