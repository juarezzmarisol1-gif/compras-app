"""
services/validators.py
Lógica de validación de negocio reutilizable desde cualquier router.
"""

from fastapi import HTTPException


def validar_dia_entrega(dias_entrega_str: str, dia_seleccionado: str) -> None:
    """
    Valida que el día seleccionado esté dentro de los días de entrega
    configurados en el perfil del proveedor.

    Raises:
        HTTPException 400 con detalle estructurado si falla la validación.
    """
    if not dias_entrega_str or not dias_entrega_str.strip():
        raise HTTPException(
            status_code=400,
            detail={
                "code": "NO_DELIVERY_DAYS",
                "message": "El proveedor no tiene días de entrega configurados.",
            },
        )

    dias_permitidos = [d.strip() for d in dias_entrega_str.split(",")]

    if dia_seleccionado not in dias_permitidos:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "DAY_NOT_ALLOWED",
                "message": (
                    f"El proveedor no realiza entregas los {dia_seleccionado}. "
                    f"Días disponibles: {', '.join(dias_permitidos)}."
                ),
                "allowed_days": dias_permitidos,
                "requested_day": dia_seleccionado,
            },
        )
