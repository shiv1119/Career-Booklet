from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
from fastapi.responses import JSONResponse

app = FastAPI(title="API Gateway")

# Allowed origins for CORS
allowed_origins = [
    "http://localhost:3000",
    "https://your-production-domain.com",
    "http://127.0.0.1:9002",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Microservices mapping
services = {
    "auth_service": "http://127.0.0.1:9000",
    "profile_service": "http://127.0.0.1:9001",
}

AUTH_SERVICE_URL = "http://127.0.0.1:9000/api/validate-token"

async def validate_token(token: str) -> str:
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(AUTH_SERVICE_URL, json={"token": token})
            response.raise_for_status()
            data = response.json()
            user_id = data.get("user_id")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token: User ID not found")
            return user_id
        except httpx.HTTPStatusError:
            raise HTTPException(status_code=401, detail="Invalid token")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Auth service unavailable")

async def forward_request(service_url: str, request: Request, user_id: str, path: str):
    async with httpx.AsyncClient() as client:
        try:
            headers = dict(request.headers)
            headers["x-user-id"] = str(user_id) 

            response = await client.request(
                method=request.method,
                url=str(httpx.URL(service_url + path)),
                headers=headers,
                params=request.query_params,
                content=await request.body(),
            )
            return response
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Service Unavailable: {e}")

@app.api_route("/", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def gateway(service: str, path: str, request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header missing or invalid")

    token = auth_header.split(" ")[1]

    user_id = await validate_token(token)

    service_url = services[service]
    if not service_url:
        raise HTTPException(status_code=404, detail="Service not found")

    response = await forward_request(service_url, request, user_id, path)

    return JSONResponse(
        status_code=response.status_code,
        content=response.json() if response.headers.get("Content-Type") == "application/json" else response.text,
    )
