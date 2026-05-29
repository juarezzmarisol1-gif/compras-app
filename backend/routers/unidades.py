"""
routers/unidades.py
CRUD de unidades de negocio.
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
    SHEET_UNIDADES,
)
from models import UnidadNegocioCreate

router = APIRouter(prefix="/unidades", tags=["unidades"])


async def _run(fn, *args):
    loop = get_event_loop()
    return await loop.run_in_executor(None, partial(fn, *args))


@router.get("/")
async def list_unidades():
    records = await _run(fetch_all_records, SHEET_UNIDADES)
    return {"items": records, "total": len(records)}


@router.post("/", status_code=201)
async def create_unidad(payload: UnidadNegocioCreate):
    new_id = str(uuid.uuid4())[:8].upper()
    await _run(append_row, SHEET_UNIDADES, [new_id, payload.NombreUnidad, payload.Descripcion])
    return {"message": "Unidad de negocio creada.", "id": new_id}


@router.put("/{unidad_id}")
async def update_unidad(unidad_id: str, payload: UnidadNegocioCreate):
    row_index = await _run(find_row_index_by_id, SHEET_UNIDADES, unidad_id)
    if not row_index:
        raise HTTPException(status_code=404, detail="Unidad de negocio no encontrada.")
    await _run(update_row, SHEET_UNIDADES, row_index, [unidad_id, payload.NombreUnidad, payload.Descripcion])
    return {"message": "Unidad actualizada.", "id": unidad_id}


@router.delete("/{unidad_id}", status_code=204)
async def delete_unidad(unidad_id: str):
    row_index = await _run(find_row_index_by_id, SHEET_UNIDADES, unidad_id)
    if not row_index:
        raise HTTPException(status_code=404, detail="Unidad de negocio no encontrada.")
    await _run(delete_row, SHEET_UNIDADES, row_index)
