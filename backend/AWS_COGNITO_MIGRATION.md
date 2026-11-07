# AeroDispatch — AWS Cognito Migration & Cloud Security Architecture

## 1. Executive Summary & Objective

AeroDispatch is architected with a strict separation of concerns between **Authentication / Identity Management** and **Core Shipment Business Logic**. 
During the local development phase, identity verification and claim issuance are handled by `LocalAuthService` (using Argon2id password hashing, rotating JWT tokens, and token family tracking). 

When transitioning to AWS Cloud deployment, authentication will transition to **Amazon Cognito User Pools** without requiring any rewriting of the order management, dispatch routing, state machine, or telemetry broadcasting services.

---

## 2. Modular Architecture & The `AuthServiceInterface`

The application enforces the **Dependency Inversion Principle**. Every API endpoint, dependency, and background service depends exclusively on the abstract interface:

```python
class AuthServiceInterface(ABC):
    @abstractmethod
    def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]: ...

    @abstractmethod
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]: ...
```

### Current vs. Future Implementation

```
+-------------------------------------------------------------+
|                      FastAPI Application                    |
|    Depends on AuthServiceInterface via get_current_user     |
+-------------------------------------------------------------+
                               |
         +---------------------+---------------------+
         | (Local Mode)                              | (Future Cloud Mode)
         v                                           v
+-------------------------------+           +-------------------------------+
|       LocalAuthService        |           |       CognitoAuthService      |
|  - Argon2id Password Hashing  |           |  - AWS Cognito User Pools     |
|  - HS256 HMAC Signatures      |           |  - RS256 Asymmetric JWKS Keys |
|  - In-Memory Token Families   |           |  - Cognito Hosted Refresh     |
|  - Double-Submit CSRF Cookies |           |  - AWS WAF / API Gateway Auth |
+-------------------------------+           +-------------------------------+
```

---

## 3. Step-by-Step AWS Cognito Transition Strategy

### Step 1: Cognito User Pool Provisioning (Terraform / CloudFormation / CDK)
1. **User Pool Creation**:
   - Username Attributes: `email`.
   - Password Policy: Minimum 8 characters, requiring uppercase, lowercase, numbers, and symbols (matching our current `validate_password_complexity`).
   - MFA: Optional/Required SMS or TOTP software token.
2. **Custom Attributes & Groups**:
   - Cognito Groups: `admin`, `driver`, `customer`.
   - Custom Attributes: `custom:driver_id`, `custom:tier`.
   - Role Claim Mapping: Map Cognito Groups directly to the `role` claim in the issued ID / Access Token.
3. **App Client**:
   - Enable `ALLOW_USER_SRP_AUTH` and `ALLOW_REFRESH_TOKEN_AUTH`.
   - Prevent secret exposure for single-page web applications (React + Vite).

### Step 2: Activating `CognitoAuthService`
Replace the local verification logic in `backend/src/services/auth_service.py` with Cognito JWKS asymmetric verification:

```python
import jwt
from jwt import PyJWKClient

class CognitoAuthService(AuthServiceInterface):
    def __init__(self, user_pool_id: str, app_client_id: str, region: str = "ap-south-1"):
        self.user_pool_id = user_pool_id
        self.app_client_id = app_client_id
        self.region = region
        self.jwks_url = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"
        self.jwks_client = PyJWKClient(self.jwks_url)

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=self.app_client_id,
                issuer=f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}",
                options={"require": ["exp", "iss", "aud", "sub"]}
            )
            # Map Cognito groups to AeroDispatch role
            groups = claims.get("cognito:groups", [])
            role = "customer"
            if "admin" in groups:
                role = "admin"
            elif "driver" in groups:
                role = "driver"

            return {
                "sub": claims.get("sub"),
                "email": claims.get("email"),
                "name": claims.get("name", claims.get("email")),
                "role": role,
                "driverId": claims.get("custom:driver_id"),
                "tier": claims.get("custom:tier", "Standard"),
            }
        except Exception as e:
            logger.warning(f"Cognito token validation failed: {e}")
            return None
```

### Step 3: Zero Disruption to Business Logic
Because all FastAPI route dependencies (`get_current_user`, `require_roles`, `update_driver_status`, `create_order`, `get_order_tracking`) inspect standard claims:
- `user["role"]`
- `user["email"]`
- `user["driverId"]`
- `user["sub"]`

**Not a single line of business logic in `OrderService`, `LocalOrderRepository` / `DynamoDBOrderRepository`, `StateMachine`, or `WebSocketManager` needs to change.**

---

## 4. API Gateway Integration Pattern (Cloud Native)

In a serverless AWS deployment:
1. **HTTP API Gateway** natively inspects JWT tokens via built-in **JWT Authorizers** pointing to Cognito's Issuer URL.
2. API Gateway intercepts unauthorized requests at the edge, reducing Lambda execution invocations to zero for bad or missing tokens.
3. API Gateway forwards decoded claims in the request context (`request.requestContext.authorizer.jwt.claims`) directly to the Lambda function handler.
4. The local development environment continues to run with `LocalAuthService` for offline developer productivity and automated unit testing.

