from pydantic import BaseModel, field_validator
from typing import Optional

DIAS_VALIDOS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]
ESTADOS_VALIDOS = ["Pendiente", "Realizado"]


# ── Proveedores ──────────────────────────────────────────────────────────────

class ProveedorCreate(BaseModel):
    NombreFantasia: str
    RazonSocial: str
    Contacto: Optional[str] = ""
    Telefono: Optional[str] = ""
    Rubro: Optional[str] = ""
    DiasEntrega: str        # "Lunes,Miercoles,Viernes"
    HorariosPedido: Optional[str] = ""
    MinimoCompra: Optional[str] = ""

    @field_validator("DiasEntrega")
    @classmethod
    def dias_validos(cls, v: str) -> str:
        dias = [d.strip() for d in v.split(",")]
        invalidos = [d for d in dias if d not in DIAS_VALIDOS]
        if invalidos:
            raise ValueError(
                f"Días inválidos: {invalidos}. Permitidos: {DIAS_VALIDOS}"
            )
        return v

class ProveedorUpdate(ProveedorCreate):
    pass


# ── Unidades de Negocio ───────────────────────────────────────────────────────

class UnidadNegocioCreate(BaseModel):
    NombreUnidad: str
    Descripcion: Optional[str] = ""


# ── Planificación ─────────────────────────────────────────────────────────────

class PlanificacionCreate(BaseModel):
    SemanaCodigo: str           # "2026-W22"
    UnidadNegocioID: str
    ProveedorID: str
    DiaSeleccionado: str

    @field_validator("DiaSeleccionado")
    @classmethod
    def dia_valido(cls, v: str) -> str:
        if v not in DIAS_VALIDOS:
            raise ValueError(f"Día inválido: '{v}'. Debe ser uno de {DIAS_VALIDOS}.")
        return v

class PlanificacionBulkCreate(BaseModel):
    """Permite guardar toda la grilla semanal en un solo request."""
    items: list[PlanificacionCreate]


# ── Checklist ─────────────────────────────────────────────────────────────────

class ChecklistUpdate(BaseModel):
    EstadoPedido: str

    @field_validator("EstadoPedido")
    @classmethod
    def estado_valido(cls, v: str) -> str:
        if v not in ESTADOS_VALIDOS:
            raise ValueError(
                f"EstadoPedido inválido: '{v}'. Debe ser uno de {ESTADOS_VALIDOS}."
            )
        return v
