#!/usr/bin/env bash

awslocal dynamodb create-table --table-name local-IpvStub-UserIdentity --key-schema AttributeName=UserIdentityId,KeyType=HASH --attribute-definitions AttributeName=UserIdentityId,AttributeType=S --billing-mode PAY_PER_REQUEST --region eu-west-2
awslocal dynamodb create-table --table-name local-SisStub-UserIdentity --key-schema AttributeName=UserIdentityId,KeyType=HASH --attribute-definitions AttributeName=UserIdentityId,AttributeType=S --billing-mode PAY_PER_REQUEST --region eu-west-2
awslocal dynamodb create-table --table-name local-AuthStub-AuthCode --key-schema AttributeName=authCode,KeyType=HASH --attribute-definitions AttributeName=authCode,AttributeType=S --billing-mode PAY_PER_REQUEST --region eu-west-2
awslocal dynamodb create-table --table-name local-AuthStub-AccessToken --key-schema AttributeName=accessToken,KeyType=HASH --attribute-definitions AttributeName=accessToken,AttributeType=S --billing-mode PAY_PER_REQUEST --region eu-west-2
awslocal dynamodb create-table --table-name local-AuthStub-UserProfile --key-schema AttributeName=email,KeyType=HASH --attribute-definitions AttributeName=email,AttributeType=S AttributeName=subjectId,AttributeType=S --global-secondary-indexes \
          "[
              {
                \"IndexName\": \"SubjectIdIndex\",
                \"KeySchema\": [
                  { \"AttributeName\": \"subjectId\", \"KeyType\": \"HASH\"}
                ],
                \"Projection\": {\"ProjectionType\":\"ALL\"}
              }
          ]" \
  --billing-mode PAY_PER_REQUEST --region eu-west-2


  awslocal dynamodb create-table --table-name local-AIS-stub-interventions --key-schema AttributeName=pairwiseId,KeyType=HASH --billing-mode PAY_PER_REQUEST --attribute-definitions AttributeName=pairwiseId,AttributeType=S --region eu-west-2

  ws dynamodb create-table \
    --table-name local-OidcStore \
    --billing-mode PAY_PER_REQUEST \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=grantId,AttributeType=S \
        AttributeName=uid,AttributeType=S \
        AttributeName=userCode,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
    --global-secondary-indexes \
        'IndexName=GSI-1,KeySchema=[{AttributeName=grantId,KeyType=HASH}],Projection={ProjectionType=KEYS_ONLY}' \
        'IndexName=GSI-2,KeySchema=[{AttributeName=uid,KeyType=HASH}],Projection={ProjectionType=KEYS_ONLY}' \
        'IndexName=GSI-3,KeySchema=[{AttributeName=userCode,KeyType=HASH}],Projection={ProjectionType=KEYS_ONLY}'

  aws dynamodb update-time-to-live \
    --table-name local-OidcStore \
    --time-to-live-specification "Enabled=true, AttributeName=expiresAt"