"""
routers/proveedores.py
CRUD completo de proveedores contra Google Sheets.
"""

import uuid
from asyncio import get_event_loop
from functools import partial
from fastapi import APIRouter, HTTPException

from database import (
    fetch_all_records,
    append_row,
    update_row,
    delete_row,
    find_row_index_by_id,
    SHEET_PROVEEDORES,
)
from models import ProveedorCreate, ProveedorUpdate

router = APIRouter(prefix="/proveedores", tags=["proveedores"])

COLUMNS = [
    "ID", "NombreFantasia", "RazonSocial", "Contacto",
    "Telefono", "Rubro", "DiasEntrega", "HorariosPedido", "MinimoCompra",
]


def _to_row(record_id: str, data: ProveedorCreate) -> list:
    return [
        record_id,
        data.NombreFantasia,
        data.RazonSocial,
        data.Contacto,
        data.Telefono,
        data.Rubro,
        data.DiasEntrega,
        data.HorariosPedido,
        data.MinimoCompra,
    ]


async def _run(fn, *args):
    """Ejecuta función síncrona de gspread en threadpool."""
    loop = get_event_loop()
    return await loop.run_in_executor(None, partial(fn, *args))


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/")
async def list_proveedores():
    records = await _run(fetch_all_records, SHEET_PROVEEDORES)
    return {"items": records, "total": len(records)}


@router.get("/{proveedor_id}")
async def get_proveedor(proveedor_id: str):
    records = await _run(fetch_all_records, SHEET_PROVEEDORES)
    proveedor = next((r for r in records if r["ID"] == proveedor_id), None)
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    return proveedor


@router.post("/", status_code=201)
async def create_proveedor(payload: ProveedorCreate):
    new_id = str(uuid.uuid4())[:8].upper()
    row = _to_row(new_id, payload)
    await _run(append_row, SHEET_PROVEEDORES, row)
    return {"message": "Proveedor creado.", "id": new_id}


@router.put("/{proveedor_id}")
async def update_proveedor(proveedor_id: str, payload: ProveedorUpdate):
    row_index = await _run(find_row_index_by_id, SHEET_PROVEEDORES, proveedor_id)
    if not row_index:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    row = _to_row(proveedor_id, payload)
    await _run(update_row, SHEET_PROVEEDORES, row_index, row)
    return {"message": "Proveedor actualizado.", "id": proveedor_id}


@router.delete("/{proveedor_id}", status_code=204)
async def delete_proveedor(proveedor_id: str):
    row_index = await _run(find_row_index_by_id, SHEET_PROVEEDORES, proveedor_id)
    if not row_index:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    await _run(delete_row, SHEET_PROVEEDORES, row_index)
