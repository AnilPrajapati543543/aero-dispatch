"""
AeroDispatch - Automated AWS Cloud Infrastructure Provisioner
Provisions DynamoDB, S3 Private Bucket, and Cognito User Pool in Seoul (ap-northeast-2).
"""
import os
import sys
import time
import json
import boto3
from botocore.exceptions import ClientError

def load_env(env_path: str):
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip()
    return env_vars

def main():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(backend_dir, ".env")
    env = load_env(env_path)

    key_id = env.get("AWS_ACCESS_KEY_ID")
    secret_key = env.get("AWS_SECRET_ACCESS_KEY")
    region = env.get("AWS_DEFAULT_REGION", "ap-northeast-2")
    account_id = env.get("AWS_ACCOUNT_ID", "761112473042")
    table_name = env.get("ORDERS_TABLE_NAME", "aerodispatch-orders")
    proofs_bucket_name = env.get("UPLOADS_BUCKET_NAME", f"aerodispatch-proofs-{account_id}")
    user_pool_name = "aerodispatch-user-pool"

    print("======================================================================")
    print("  AeroDispatch - AWS Cloud Infrastructure Provisioner")
    print(f"  Region: {region} | Account: {account_id}")
    print("======================================================================")

    session = boto3.Session(
        aws_access_key_id=key_id,
        aws_secret_access_key=secret_key,
        region_name=region,
    )

    # 1. DynamoDB
    print("\n[1/3] Provisioning Amazon DynamoDB Table...")
    dynamodb = session.client("dynamodb")
    try:
        existing_tables = dynamodb.list_tables().get("TableNames", [])
        if table_name in existing_tables:
            print(f"  [OK] DynamoDB table '{table_name}' already exists.")
        else:
            print(f"  Creating DynamoDB table '{table_name}' (PAY_PER_REQUEST)...")
            dynamodb.create_table(
                TableName=table_name,
                BillingMode="PAY_PER_REQUEST",
                AttributeDefinitions=[
                    {"AttributeName": "orderId", "AttributeType": "S"},
                    {"AttributeName": "idempotencyKey", "AttributeType": "S"},
                    {"AttributeName": "customerEmail", "AttributeType": "S"},
                ],
                KeySchema=[
                    {"AttributeName": "orderId", "KeyType": "HASH"},
                ],
                GlobalSecondaryIndexes=[
                    {
                        "IndexName": "IdempotencyIndex",
                        "KeySchema": [
                            {"AttributeName": "idempotencyKey", "KeyType": "HASH"},
                        ],
                        "Projection": {"ProjectionType": "ALL"},
                    },
                    {
                        "IndexName": "CustomerEmailIndex",
                        "KeySchema": [
                            {"AttributeName": "customerEmail", "KeyType": "HASH"},
                        ],
                        "Projection": {"ProjectionType": "ALL"},
                    },
                ],
                SSESpecification={"Enabled": True},
                Tags=[
                    {"Key": "Project", "Value": "AeroDispatch"},
                    {"Key": "Environment", "Value": "Production"},
                ],
            )
            print(f"  Waiting for '{table_name}' to become ACTIVE...")
            waiter = dynamodb.get_waiter("table_exists")
            waiter.wait(TableName=table_name)
            print(f"  [OK] DynamoDB table '{table_name}' is ACTIVE!")
    except Exception as e:
        print(f"  [ERROR] DynamoDB Error: {e}")

    # 2. Amazon S3 (Proofs Bucket)
    print("\n[2/3] Provisioning Amazon S3 Private Proofs Bucket...")
    s3 = session.client("s3")
    try:
        buckets = [b["Name"] for b in s3.list_buckets().get("Buckets", [])]
        if proofs_bucket_name in buckets:
            print(f"  [OK] S3 bucket '{proofs_bucket_name}' already exists.")
        else:
            print(f"  Creating S3 bucket '{proofs_bucket_name}' in '{region}'...")
            s3.create_bucket(
                Bucket=proofs_bucket_name,
                CreateBucketConfiguration={"LocationConstraint": region},
            )
            print(f"  [OK] S3 bucket '{proofs_bucket_name}' created.")

        # Configure Public Access Block
        s3.put_public_access_block(
            Bucket=proofs_bucket_name,
            PublicAccessBlockConfiguration={
                "BlockPublicAcls": True,
                "IgnorePublicAcls": True,
                "BlockPublicPolicy": True,
                "RestrictPublicBuckets": True,
            },
        )
        print("  [OK] S3 Public Access Block enabled (100% Private).")

        # Configure S3 CORS for direct browser PUT uploads
        s3.put_bucket_cors(
            Bucket=proofs_bucket_name,
            CORSConfiguration={
                "CORSRules": [
                    {
                        "AllowedHeaders": ["*"],
                        "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
                        "AllowedOrigins": ["*"],
                        "ExposeHeaders": ["ETag"],
                        "MaxAgeSeconds": 3600,
                    }
                ]
            },
        )
        print("  [OK] S3 Bucket CORS rules configured for presigned URL uploads.")
    except Exception as e:
        print(f"  [ERROR] S3 Error: {e}")

    # 3. Amazon Cognito User Pool
    print("\n[3/3] Provisioning Amazon Cognito User Pool & Groups...")
    cognito = session.client("cognito-idp")
    user_pool_id = None
    app_client_id = None
    try:
        # Check if user pool already exists
        pools = cognito.list_user_pools(MaxResults=20).get("UserPools", [])
        for pool in pools:
            if pool["Name"] == user_pool_name:
                user_pool_id = pool["Id"]
                break

        if user_pool_id:
            print(f"  [OK] Cognito User Pool '{user_pool_name}' found: {user_pool_id}")
        else:
            print(f"  Creating Cognito User Pool '{user_pool_name}'...")
            res = cognito.create_user_pool(
                PoolName=user_pool_name,
                Policies={
                    "PasswordPolicy": {
                        "MinimumLength": 8,
                        "RequireUppercase": True,
                        "RequireLowercase": True,
                        "RequireNumbers": True,
                        "RequireSymbols": True,
                    }
                },
                AutoVerifiedAttributes=["email"],
                UsernameAttributes=["email"],
                AdminCreateUserConfig={"AllowAdminCreateUserOnly": False},
                Schema=[
                    {"Name": "email", "AttributeDataType": "String", "Required": True, "Mutable": True},
                    {"Name": "name", "AttributeDataType": "String", "Required": False, "Mutable": True},
                ],
            )
            user_pool_id = res["UserPool"]["Id"]
            print(f"  [OK] Cognito User Pool created: {user_pool_id}")

        # Create App Client
        clients = cognito.list_user_pool_clients(UserPoolId=user_pool_id, MaxResults=10).get("UserPoolClients", [])
        for client in clients:
            if client["ClientName"] == "aerodispatch-spa-client":
                app_client_id = client["ClientId"]
                break

        if app_client_id:
            print(f"  [OK] Cognito App Client found: {app_client_id}")
        else:
            print("  Creating Cognito App Client (SPA without secret)...")
            client_res = cognito.create_user_pool_client(
                UserPoolId=user_pool_id,
                ClientName="aerodispatch-spa-client",
                GenerateSecret=False,
                ExplicitAuthFlows=[
                    "ALLOW_USER_PASSWORD_AUTH",
                    "ALLOW_USER_SRP_AUTH",
                    "ALLOW_REFRESH_TOKEN_AUTH",
                ],
            )
            app_client_id = client_res["UserPoolClient"]["ClientId"]
            print(f"  [OK] Cognito App Client created: {app_client_id}")

        # Create Groups
        for group_name, desc in [
            ("admin", "AeroDispatch Dispatch Administrators"),
            ("driver", "AeroDispatch Delivery Couriers"),
            ("customer", "AeroDispatch Consignment Customers"),
        ]:
            try:
                cognito.create_group(
                    GroupName=group_name,
                    UserPoolId=user_pool_id,
                    Description=desc,
                )
                print(f"  [OK] Created Cognito Group: '{group_name}'")
            except cognito.exceptions.GroupExistsException:
                print(f"  [OK] Cognito Group '{group_name}' already exists.")
    except Exception as e:
        print(f"  [ERROR] Cognito Error: {e}")

    print("\n======================================================================")
    print("  AWS INFRASTRUCTURE PROVISIONING COMPLETE")
    print("======================================================================")
    print(f"  Region:              {region}")
    print(f"  DynamoDB Table:      {table_name}")
    print(f"  S3 Proofs Bucket:    {proofs_bucket_name}")
    print(f"  Cognito User Pool:   {user_pool_id}")
    print(f"  Cognito App Client:  {app_client_id}")
    print("======================================================================")

    # Save output to aws_cloud_manifest.json
    manifest = {
        "region": region,
        "accountId": account_id,
        "dynamoDbTable": table_name,
        "s3ProofsBucket": proofs_bucket_name,
        "cognitoUserPoolId": user_pool_id,
        "cognitoAppClientId": app_client_id,
        "status": "ACTIVE",
    }
    manifest_path = os.path.join(backend_dir, "aws_cloud_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nManifest written to: {manifest_path}")

if __name__ == "__main__":
    main()
