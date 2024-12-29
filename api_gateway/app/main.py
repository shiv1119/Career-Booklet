from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.security import OAuth2PasswordBearer
from fastapi import Request
from fastapi.responses import JSONResponse
import httpx
import json

from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="API Gateway")
allowed_origins = [
    "http://localhost:3000",
    "https://your-production-domain.com",
    "http://127.0.0.1:9002",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5500/javatest.html"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



services = {
    "auth_service": "http://127.0.0.1:9000",
    "profile_service": "http://127.0.0.1:9001",
}

AUTH_SERVICE_URL = "http://127.0.0.1:9000/api/validate-token"

async def validate_token(token: str) -> str:
    """
    Validate the token with the auth service and return the user_id if valid.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(AUTH_SERVICE_URL, json={"token": token})
            if response.status_code == 200:
                return response.json().get("user_id")
            raise HTTPException(status_code=401, detail="Invalid token")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Auth service unavailable")

async def forward_request(service_url: str, method: str, path: str, body=None):
    """
    Forward the request to the target service.
    """
    async with httpx.AsyncClient() as client:
        url = f"{service_url}/api/{path}"
        print(url)
        if body:
            # Ensure that we are sending the request as JSON and automatically setting the Content-Length

            response = await client.request(method, url, json=body)
        else:
            response = await client.request(method, url)

        return response

@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def gateway(service: str, path: str, request: Request, authorization: str = Header(None)):
    """
    Main API Gateway route that forwards requests to backend services.
    """
    if service not in services:
        raise HTTPException(status_code=404, detail="Service not found")

    # Validate token and get user_id
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        user_id = await validate_token(authorization)
        print(f"Validated user ID: {user_id}")
    except HTTPException as e:
        raise e

    # Log the incoming request body
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            body = await request.json()

        except Exception as e:
            print(f"Error reading body: {e}")
            raise HTTPException(status_code=400, detail="Invalid JSON in request body")
    else:
        body = None

    service_url = services[service]
    body = body or {}

    body["auth_user_id"] = user_id
    print(body)

    try:
        response = await forward_request(service_url, request.method, f"{path}", body)
        return JSONResponse(status_code=response.status_code, content=response.json())
    except Exception as e:
        print(f"Error forwarding request: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while forwarding request")
