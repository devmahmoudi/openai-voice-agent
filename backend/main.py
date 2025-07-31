from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
from enum import Enum

load_dotenv()

app = FastAPI()
OPENAI_API_URL = "https://api.openai.com/v1/realtime/sessions"

class OpenAIModel(str, Enum):
    GPT4_REALTIME = "gpt-4o-realtime-preview-2025-06-03"

# Use query parameters instead of a body for GET
@app.get("/v1/agent/client_key")
async def get_client_key(model: OpenAIModel = OpenAIModel.GPT4_REALTIME):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            # Forward model as a query param to OpenAI
            response = await client.post(
                OPENAI_API_URL,
                headers=headers,
                json={"model": model.value}
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