from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()
OPENAI_API_URL = "https://api.openai.com/v1/realtime/sessions"

class SessionRequest(BaseModel):
    model: str

@app.post("/v1/agent/client_key")
async def create_openai_session(request_data: SessionRequest):
    # Get API key from .env
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    # Headers for OpenAI (using key from .env)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Forward request to OpenAI
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                OPENAI_API_URL,
                headers=headers,
                json={"model": request_data.model}
            )
            response.raise_for_status()
            data = response.json()
            if 'client_secret' not in data:
                raise HTTPException(status_code=500, detail="OpenAI response missing client_secret")
            return data['client_secret']
        
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=e.response.json()
            )