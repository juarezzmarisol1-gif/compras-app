# 🛒 Gestión de Compras — Planificación de Pedidos Semanales

Aplicación web para gestión de proveedores y planificación de pedidos semanales.
Backend en **FastAPI** (Vercel) + Frontend en **React/Vite** (Netlify).
Base de datos: **Google Sheets** vía API.

---

## Arquitectura

```
Browser
  └── React (Vite) — Netlify
        └── REST/JSON
              └── FastAPI — Vercel (serverless)
                    └── gspread
                          └── Google Sheets
```

---

## Estructura del proyecto

```
compras-app/
├── backend/
│   ├── main.py              # FastAPI app + CORS
│   ├── database.py          # Capa gspread
│   ├── models.py            # Pydantic schemas
│   ├── routers/
│   │   ├── proveedores.py   # GET/POST/PUT/DELETE /proveedores
│   │   ├── planificacion.py # GET/POST/PATCH /planificacion
│   │   └── unidades.py      # GET/POST/PUT /unidades
│   ├── services/
│   │   └── validators.py    # Validación días de entrega
│   ├── utils/
│   │   └── date_helpers.py  # Semanas ISO
│   ├── requirements.txt
│   ├── vercel.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── App.jsx + App.css
    │   ├── main.jsx + index.css
    │   ├── api/client.js        # Axios centralizado
    │   ├── hooks/useApi.js      # Hook de fetching
    │   └── pages/
    │       ├── Proveedores.jsx  # ABM proveedores
    │       ├── Planificacion.jsx # Grilla semanal
    │       └── Checklist.jsx    # Dashboard checklist
    ├── package.json
    ├── vite.config.js
    ├── netlify.toml
    └── .env.example
```

---

## Setup inicial

### 1. Google Sheets

1. Crear un spreadsheet con tres hojas exactamente con estos nombres:

   | Hoja | Columnas (fila 1 = encabezados) |
   |---|---|
   | `Proveedores` | ID, NombreFantasia, RazonSocial, Contacto, Telefono, Rubro, DiasEntrega, HorariosPedido, MinimoCompra |
   | `UnidadesNegocio` | ID, NombreUnidad, Descripcion |
   | `PlanificacionSemanal` | ID, SemanaCodigo, UnidadNegocioID, ProveedorID, DiaSeleccionado, EstadoPedido, Timestamp |

2. Crear una Service Account en [Google Cloud Console](https://console.cloud.google.com/):
   - IAM → Service Accounts → Create
   - Generar clave JSON y guardar como `backend/service_account.json` (gitignoreado)
   - Habilitar la **Google Sheets API** y **Google Drive API** en el proyecto

3. Compartir el spreadsheet con el email de la service account (rol Editor)

4. Copiar el ID del spreadsheet desde la URL: `/d/{SHEET_ID}/edit`

---

### 2. Backend (desarrollo local)

```bash
cd backend

# Crear entorno virtual
python -m venv .venv
source .venv/bin/activate        # Mac/Linux
# .venv\Scripts\activate         # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env:
#   GOOGLE_SHEET_ID=tu_sheet_id
#   GOOGLE_SERVICE_ACCOUNT_JSON=./service_account.json
#   ALLOWED_ORIGINS=http://localhost:5173

# Iniciar servidor
uvicorn main:app --reload --port 8000
```

Swagger UI disponible en: http://localhost:8000/docs

---

### 3. Frontend (desarrollo local)

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# .env ya tiene: VITE_API_URL=http://localhost:8000

# Iniciar dev server
npm run dev
```

App disponible en: http://localhost:5173

---

## Deploy en producción

### Backend → Vercel

```bash
cd backend
npm i -g vercel      # si no tenés el CLI
vercel login
vercel --prod
```

En el dashboard de Vercel, agregar estas variables de entorno:
- `GOOGLE_SHEET_ID` = tu sheet id
- `GOOGLE_SERVICE_ACCOUNT_INFO` = contenido JSON completo de la service account (como string)
- `ALLOWED_ORIGINS` = https://tu-app.netlify.app

### Frontend → Netlify

El `netlify.toml` ya está configurado. Solo conectar el repo en Netlify y agregar:
- `VITE_API_URL` = https://tu-api.vercel.app

---

## Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/proveedores/` | Listar todos |
| POST | `/proveedores/` | Crear proveedor |
| PUT | `/proveedores/{id}` | Actualizar |
| DELETE | `/proveedores/{id}` | Eliminar |
| GET | `/unidades/` | Listar unidades de negocio |
| POST | `/unidades/` | Crear unidad |
| GET | `/planificacion/semana-actual` | Semana ISO actual + días |
| GET | `/planificacion/{semana}` | Planificación de una semana (con join) |
| POST | `/planificacion/` | Crear ítem (valida días) |
| POST | `/planificacion/bulk` | Guardar grilla completa (valida todos) |
| PATCH | `/planificacion/{id}/estado` | Actualizar estado checklist |
| GET | `/health` | Health check |

---

## Validación de días de entrega

La validación ocurre en dos capas:

**Frontend** (`Planificacion.jsx`): al seleccionar un proveedor para un día, el select
solo muestra proveedores que tengan ese día en su `DiasEntrega`. Si igual se intenta
una combinación inválida, se muestra un toast y se resetea la selección.

**Backend** (`services/validators.py`): el endpoint `POST /planificacion` y
`POST /planificacion/bulk` validan contra los datos de Google Sheets y retornan
`HTTP 400` con código `DAY_NOT_ALLOWED` si la validación falla.

---

## Notas de desarrollo

- El cliente gspread es síncrono; se ejecuta en el threadpool de asyncio via
  `loop.run_in_executor()` para no bloquear el event loop de FastAPI.
- Los datos en Sheets se identifican por una columna `ID` (siempre columna A).
  No eliminar ni reordenar esa columna.
- `DiasEntrega` se almacena como string separado por comas: `"Lunes,Miercoles,Viernes"`.
- `SemanaCodigo` sigue el estándar ISO 8601: `"2026-W22"`.
