from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import artisans, artifacts, artsnap, tips

app = FastAPI(
    title="KalaSetu API",
    description="Phygital Authentication Ecosystem for Indian Handicrafts",
    version="1.0.0",
)

# CORS – allows the React frontend (localhost:5173) to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route registration
app.include_router(artisans.router, prefix="/api")
app.include_router(artifacts.router, prefix="/api")
app.include_router(artsnap.router, prefix="/api")
app.include_router(tips.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "KalaSetu API is running 🪡"}


@app.get("/health")
async def health():
    return {"status": "ok"}
