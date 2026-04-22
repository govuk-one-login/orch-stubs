# ais-stub 

A simple stub of the account interventions service. This is composed of a dynamoDB table to store stub interventions data and a lambda connected to an API Gateway at the path `/v1/ais/{anyRandomId}`. By default the stub returns a no-op intervention state. 

## Testing against dev

Our dev environment is already setup to test against this stub by default. To test a particular interventions case, you can add data to the `dev-AIS-stub-interventions` table for a known pairwiseID. The stub will then return this information instead of the default no-op intervention.


## Running locally

To run the stub locally, you can setup the stub API using sam local and stub the DynamoDB interactions using localstack. To do this you'll need to run the following commands:

```
npm run localstack:up       
```

and then 

```
 npm run start:local:ais 
```

You will then be able to see a stub interventions response on this URL:

```
curl http://127.0.0.1:3002/v1/ais/{anyRandomId} | jq .
>> {
  "intervention": {
    "updatedAt": 1696969322935,
    "appliedAt": 1696869005821,
    "sentAt": 1696869003456,
    "description": "description",
    "reprovedIdentityAt": 1696969322935,
    "resetPasswordAt": 1696875903456
  },
  "state": {
    "blocked": false,
    "reproveIdentity": false,
    "suspended": false,
    "resetPassword": false
  }
}

```

