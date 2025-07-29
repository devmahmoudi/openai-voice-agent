# main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from datetime import datetime
import os

app = FastAPI()

@app.websocket("/ws/voice-stream-to-file")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Create filename with current datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"voice_recording_{timestamp}.wav"
    
    # Ensure recordings directory exists
    recordings_dir = "recordings"
    os.makedirs(recordings_dir, exist_ok=True)
    filepath = os.path.join(recordings_dir, filename)
    
    print(f"Starting voice recording: {filepath}")
    
    try:
        with open(filepath, "wb") as audio_file:
            while True:
                # Receive binary data (voice buffer bytes)
                data = await websocket.receive_bytes()
                audio_file.write(data)
                audio_file.flush()  # Ensure data is written immediately
                
                # Send acknowledgment back to client
                await websocket.send_text(f"Received {len(data)} bytes")
                
    except WebSocketDisconnect:
        print(f"Client disconnected. Recording saved to: {filepath}")
    except Exception as e:
        print(f"Error during recording: {e}")
        if os.path.exists(filepath):
            os.remove(filepath)  # Clean up incomplete file