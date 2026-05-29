"""
main.py
Punto de entrada de la API FastAPI.
Ejecutar localmente: uvicorn main:app --reload --port 8000
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import proveedores, planificacion, unidades

load_dotenv()

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Gestión de Compras API",
    description="Backend para planificación de pedidos semanales con Google Sheets.",
    version="1.0.0",
    docs_url="/docs",       # Swagger UI en /docs
    redoc_url="/redoc",     # ReDoc en /redoc
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# En desarrollo: permite el dev server de Vite (localhost:5173).
# En producción: setear ALLOWED_ORIGINS=https://tu-app.netlify.app en Vercel.

_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(proveedores.router)
app.include_router(planificacion.router)
app.include_router(unidades.router)

# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok", "version": app.version}


@app.get("/", tags=["meta"])
async def root():
    return {
        "message": "Gestión de Compras API",
        "docs": "/docs",
        "health": "/health",
    }
