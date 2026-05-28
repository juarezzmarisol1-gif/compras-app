"""
utils/date_helpers.py
Funciones para manejo de semanas ISO.
"""

from datetime import datetime, timedelta


def get_semana_actual() -> str:
    """Retorna el código ISO de la semana actual. Ej: '2026-W22'"""
    hoy = datetime.now()
    year, week, _ = hoy.isocalendar()
    return f"{year}-W{week:02d}"


def get_lunes_de_semana(codigo: str) -> datetime:
    """
    Dado '2026-W22', retorna el datetime del lunes de esa semana.
    Usa el estándar ISO 8601 donde la semana empieza el lunes.
    """
    year_str, week_str = codigo.split("-W")
    return datetime.strptime(f"{year_str}-W{int(week_str):02d}-1", "%Y-W%W-%w")


def get_dias_de_semana(codigo: str) -> list[dict]:
    """
    Retorna lista de dicts con nombre y fecha para cada día de la semana.
    Ejemplo de retorno:
        [{"dia": "Lunes", "fecha": "01/06"}, ...]
    """
    nombres = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]
    lunes = get_lunes_de_semana(codigo)
    return [
        {"dia": nombres[i], "fecha": (lunes + timedelta(days=i)).strftime("%d/%m")}
        for i in range(6)
    ]
