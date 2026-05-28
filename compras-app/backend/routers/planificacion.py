"""
routers/planificacion.py
Gestión de la planificación semanal con validación de días de entrega.
"""

import uuid
from asyncio import get_event_loop
from datetime import datetime
from functools import partial
from fastapi import APIRouter, HTTPException

from database import (
    fetch_all_records,
    append_row,
    find_row_index_by_id,
    SHEET_PLANIFICACION,
    SHEET_PROVEEDORES,
    SHEET_UNIDADES,
)
from models import PlanificacionCreate, PlanificacionBulkCreate, ChecklistUpdate
from services.validators import validar_dia_entrega
from utils.date_helpers import get_semana_actual, get_dias_de_semana

router = APIRouter(prefix="/planificacion", tags=["planificacion"])


async def _run(fn, *args):
    loop = get_event_loop()
    return await loop.run_in_executor(None, partial(fn, *args))


def _build_row(item_id: str, payload: PlanificacionCreate) -> list:
    return [
        item_id,
        payload.SemanaCodigo,
        payload.UnidadNegocioID,
        payload.ProveedorID,
        payload.DiaSeleccionado,
        "Pendiente",
        datetime.now().isoformat(timespec="seconds"),
    ]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/semana-actual")
async def get_semana_info():
    """Retorna el código de la semana actual y sus días con fechas."""
    semana = get_semana_actual()
    return {"semana": semana, "dias": get_dias_de_semana(semana)}


@router.get("/{semana}")
async def get_planificacion(semana: str):
    """
    Retorna todos los registros de planificación para una semana.
    Incluye join con nombre de proveedor y unidad de negocio.
    """
    records       = await _run(fetch_all_records, SHEET_PLANIFICACION)
    proveedores   = await _run(fetch_all_records, SHEET_PROVEEDORES)
    unidades      = await _run(fetch_all_records, SHEET_UNIDADES)

    prov_map = {p["ID"]: p for p in proveedores}
    un_map   = {u["ID"]: u for u in unidades}

    items = []
    for r in records:
        if r.get("SemanaCodigo") != semana:
            continue
        enriquecido = dict(r)
        prov = prov_map.get(r.get("ProveedorID"), {})
        un   = un_map.get(r.get("UnidadNegocioID"), {})
        enriquecido["NombreProveedor"]      = prov.get("NombreFantasia", "—")
        enriquecido["NombreUnidadNegocio"]  = un.get("NombreUnidad", "—")
        items.append(enriquecido)

    return {"semana": semana, "items": items, "total": len(items)}


@router.post("/", status_code=201)
async def create_planificacion(payload: PlanificacionCreate):
    """
    Crea un registro de planificación individual.
    Valida que el día seleccionado coincida con DiasEntrega del proveedor.
    Retorna 400 si la validación falla.
    """
    proveedores = await _run(fetch_all_records, SHEET_PROVEEDORES)
    proveedor = next((p for p in proveedores if p["ID"] == payload.ProveedorID), None)
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")

    # ── Validación crítica de días de entrega ─────────────────────────────
    validar_dia_entrega(proveedor.get("DiasEntrega", ""), payload.DiaSeleccionado)
    # ─────────────────────────────────────────────────────────────────────

    new_id = str(uuid.uuid4())[:8].upper()
    row = _build_row(new_id, payload)
    await _run(append_row, SHEET_PLANIFICACION, row)

    return {
        "message": "Planificación guardada.",
        "id": new_id,
        "semana": payload.SemanaCodigo,
        "dia": payload.DiaSeleccionado,
        "proveedor": proveedor.get("NombreFantasia"),
    }


@router.post("/bulk", status_code=201)
async def create_planificacion_bulk(payload: PlanificacionBulkCreate):
    """
    Guarda toda la grilla semanal de una vez.
    Valida todos los ítems antes de escribir; si alguno falla, rechaza el lote completo.
    """
    proveedores = await _run(fetch_all_records, SHEET_PROVEEDORES)
    prov_map = {p["ID"]: p for p in proveedores}

    errores = []
    for i, item in enumerate(payload.items):
        proveedor = prov_map.get(item.ProveedorID)
        if not proveedor:
            errores.append({"index": i, "error": f"Proveedor '{item.ProveedorID}' no encontrado."})
            continue
        dias = proveedor.get("DiasEntrega", "")
        dias_permitidos = [d.strip() for d in dias.split(",")]
        if item.DiaSeleccionado not in dias_permitidos:
            errores.append({
                "index": i,
                "proveedor": proveedor.get("NombreFantasia"),
                "error": (
                    f"No entrega los {item.DiaSeleccionado}. "
                    f"Disponibles: {', '.join(dias_permitidos)}."
                ),
            })

    if errores:
        raise HTTPException(
            status_code=400,
            detail={"code": "BULK_VALIDATION_ERROR", "errores": errores},
        )

    created_ids = []
    for item in payload.items:
        new_id = str(uuid.uuid4())[:8].upper()
        row = _build_row(new_id, item)
        await _run(append_row, SHEET_PLANIFICACION, row)
        created_ids.append(new_id)

    return {
        "message": f"{len(created_ids)} registros guardados.",
        "ids": created_ids,
        "semana": payload.items[0].SemanaCodigo if payload.items else None,
    }


@router.patch("/{item_id}/estado")
async def update_estado(item_id: str, payload: ChecklistUpdate):
    """
    Actualiza el EstadoPedido de un ítem del checklist.
    Columna F (índice 6) = EstadoPedido.
    """
    row_index = await _run(find_row_index_by_id, SHEET_PLANIFICACION, item_id)
    if not row_index:
        raise HTTPException(status_code=404, detail="Registro no encontrado.")

    from database import update_cell
    await _run(update_cell, SHEET_PLANIFICACION, row_index, 6, payload.EstadoPedido)

    return {
        "message": "Estado actualizado.",
        "id": item_id,
        "estado": payload.EstadoPedido,
    }
