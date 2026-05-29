"""
database.py
Capa de acceso a Google Sheets usando gspread.
Todas las funciones son síncronas; FastAPI las corre en un threadpool
via run_in_executor (ver uso en routers).
"""

import os
import functools
import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv
from pathlib import Path

# Cargar .env desde el directorio del script
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

SHEET_ID = os.environ["GOOGLE_SHEET_ID"]

# Nombres de hojas
SHEET_PROVEEDORES    = "Proveedores"
SHEET_UNIDADES       = "UnidadesNegocio"
SHEET_PLANIFICACION  = "PlanificacionSemanal"


# ── Cliente singleton ─────────────────────────────────────────────────────────

@functools.lru_cache(maxsize=1)
def _get_client() -> gspread.Client:
    """Inicializa el cliente gspread una sola vez por proceso."""
    key_path = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if key_path:
        creds = Credentials.from_service_account_file(key_path, scopes=SCOPES)
    else:
        # En Vercel: credenciales como variable de entorno JSON
        import json
        info = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_INFO"])
        creds = Credentials.from_service_account_info(info, scopes=SCOPES)
    return gspread.authorize(creds)


def _get_worksheet(name: str) -> gspread.Worksheet:
    return _get_client().open_by_key(SHEET_ID).worksheet(name)


# ── CRUD genérico ─────────────────────────────────────────────────────────────

def fetch_all_records(sheet_name: str) -> list[dict]:
    """Retorna todos los registros como lista de dicts."""
    ws = _get_worksheet(sheet_name)
    return ws.get_all_records()


def append_row(sheet_name: str, values: list) -> None:
    """Agrega una fila al final de la hoja."""
    ws = _get_worksheet(sheet_name)
    ws.append_row(values, value_input_option="USER_ENTERED")


def update_row(sheet_name: str, row_index: int, values: list) -> None:
    """
    Sobreescribe una fila completa.
    row_index es 1-based; la fila 1 es el encabezado, datos desde fila 2.
    """
    ws = _get_worksheet(sheet_name)
    n_cols = len(values)
    end_col = chr(64 + n_cols)          # A=1, B=2 ... P=16
    ws.update(f"A{row_index}:{end_col}{row_index}", [values])


def update_cell(sheet_name: str, row_index: int, col_index: int, value) -> None:
    """Actualiza una celda individual. Índices 1-based."""
    ws = _get_worksheet(sheet_name)
    ws.update_cell(row_index, col_index, value)


def find_row_index_by_id(sheet_name: str, record_id: str) -> int | None:
    """
    Busca el índice de fila (1-based, incluyendo encabezado) cuya
    columna 'ID' coincide con record_id.
    Retorna None si no se encuentra.
    """
    ws = _get_worksheet(sheet_name)
    # La columna A siempre es ID en todas las hojas
    ids = ws.col_values(1)              # ['ID', 'abc123', 'def456', ...]
    try:
        return ids.index(record_id) + 1  # +1 porque col_values es 0-based
    except ValueError:
        return None


def delete_row(sheet_name: str, row_index: int) -> None:
    """Elimina una fila por índice 1-based."""
    ws = _get_worksheet(sheet_name)
    ws.delete_rows(row_index)
