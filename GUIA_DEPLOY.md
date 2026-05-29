# 🚀 Guía de Despliegue - Compras App

Esta guía te explica paso a paso cómo desplegar el proyecto en **Vercel** (backend) y **Netlify** (frontend), con sincronización a Google Sheets.

## 📋 Flujo de Trabajo

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   GitHub    │────▶│    Vercel    │────▶│   Netlify   │
│ (código)    │     │ (backend)    │     │ (frontend)  │
└─────────────┘     └──────────────┘     └─────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  Google      │
                   │  Sheets      │
                   └──────────────┘
```

## 🐍 Paso 1: Configurar Google Sheets y Service Account

### 1.1 Crear Google Sheets

Crea un spreadsheet con TRES hojas exactamente con estos nombres:

| Hoja | Columnas (fila 1 = encabezados) |
|------|--------------------------------|
| `Proveedores` | ID, NombreFantasia, RazonSocial, Contacto, Telefono, Rubro, DiasEntrega, HorariosPedido, MinimoCompra |
| `UnidadesNegocio` | ID, NombreUnidad, Descripcion |
| `PlanificacionSemanal` | ID, SemanaCodigo, UnidadNegocioID, ProveedorID, DiaSeleccionado, EstadoPedido, Timestamp |

### 1.2 Crear Service Account en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las APIs:
   - **Google Sheets API**
   - **Google Drive API**
4. Ve a **IAM & Admin → Service Accounts**
5. Crea una nueva Service Account:
   - Nombre: `compras-app-backend`
   - ID: `compras-app-backend@tu-proyecto.iam.gserviceaccount.com`
6. Genera una clave JSON:
   - Haz clic en la service account → Keys → Add Key → Create new key
   - Tipo: JSON
   - Descarga el archivo
7. Renombra el archivo a `service_account.json`

### 1.3 Compartir el Google Sheet

1. Abre tu Google Sheet
2. Haz clic en "Compartir"
3. Agrega el email de la Service Account (ej: `compras-app-backend@tu-proyecto.iam.gserviceaccount.com`)
4. Dale permisos de **Editor**
5. Copia el ID del spreadsheet desde la URL: `/d/{SHEET_ID}/edit`

### 1.4 Configurar archivo service_account.json

Coloca el archivo `service_account.json` en `backend/`:

```
compras-app/
└── backend/
    └── service_account.json  ← Tus credenciales de Google
```

⚠️ **IMPORTANTE**: Este archivo NUNCA debe subirse a GitHub (ya está en `.gitignore`).

## 🗄️ Paso 2: Preparar Repositorio GitHub

### 2.1 Inicializar repositorio

```bash
cd compras-app

# Inicializar repositorio git
git init

# Agregar todos los archivos (excepto los del .gitignore)
git add .

# Hacer commit inicial
git commit -m "Initial commit - Compras App"

# Crear repositorio en GitHub (desde github.com)
# Luego agregar el remote:
git remote add origin https://github.com/TU_USUARIO/compras-app.git

# Subir código
git push -u origin main
```

### 2.2 Archivos excluidos por .gitignore

- `backend/service_account.json` - Credenciales de Google
- `backend/.env` - Variables de entorno locales
- `frontend/node_modules/` - Dependencias de Node
- `frontend/dist/` - Build compilado

## ☁️ Paso 3: Desplegar Backend en Vercel

### 3.1 Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con GitHub (recomendado)

### 3.2 Importar proyecto

1. Haz clic en "Add New..." → "Project"
2. Importa tu repositorio `compras-app`
3. Configura el proyecto:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | `Other` |
| **Root Directory** | `./backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Output Directory** | (dejar vacío) |
| **Install Command** | `pip install -r requirements.txt` |

### 3.3 Configurar Variables de Entorno en Vercel

Agrega estas variables en Vercel (Settings → Environment Variables):

| Variable | Valor | Production |
|----------|-------|------------|
| `GOOGLE_SHEET_ID` | El ID de tu Google Sheet | ✅ |
| `GOOGLE_SERVICE_ACCOUNT_INFO` | Contenido COMPLETO del JSON de la service account (como string) | ✅ |
| `ALLOWED_ORIGINS` | `https://tu-app.netlify.app` (URL de Netlify) | ✅ |

**Para `GOOGLE_SERVICE_ACCOUNT_INFO`:**
1. Abre `backend/service_account.json`
2. Copia TODO el contenido JSON
3. Pégalo como valor de la variable (debe ser un string válido JSON)

### 3.4 Desplegar

1. Haz clic en "Deploy"
2. Espera a que termine el build
3. Vercel te dará una URL (ej: `https://compras-app-backend.vercel.app`)

### 3.5 Verificar backend

1. Abre: `https://compras-app-backend.vercel.app/health`
2. Deberías ver: `{"status":"ok","version":"1.0.0"}`
3. Swagger UI: `https://compras-app-backend.vercel.app/docs`

## ⚛️ Paso 4: Desplegar Frontend en Netlify

### 4.1 Crear cuenta en Netlify

1. Ve a [netlify.com](https://netlify.com)
2. Inicia sesión con GitHub

### 4.2 Importar repositorio

1. Haz clic en "Add new site" → "Import an existing project"
2. Selecciona GitHub
3. Busca `compras-app`

### 4.3 Configurar build

| Campo | Valor |
|-------|-------|
| **Base directory** | `frontend` |
| **Build command** | `npm run build` |
| **Publish directory** | `frontend/dist` |

### 4.4 Configurar variables de entorno

Agrega esta variable en Netlify (Site settings → Build & deploy → Environment):

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://compras-app-backend.vercel.app` |

### 4.5 Desplegar

1. Haz clic en "Deploy site"
2. Espera a que termine el build
3. Netlify te dará una URL (ej: `https://compras-app.netlify.app`)

## 🔗 Paso 5: Actualizar CORS en Vercel

Una vez que tengas la URL de Netlify:

1. Ve a Vercel → Tu proyecto → Settings → Environment Variables
2. Edita `ALLOWED_ORIGINS`
3. Agrega la URL de Netlify: `https://compras-app.netlify.app`
4. Guarda y redeploy (o espera a que Vercel detecte el cambio)

## 🧪 Paso 6: Probar la Aplicación

1. **Abre el frontend** en Netlify
2. **Navega por las secciones**:
   - Proveedores: CRUD de proveedores
   - Planificación: Grilla semanal de pedidos
   - Checklist: Dashboard de estados
3. **Verifica que los datos** se guarden en Google Sheets
4. **Prueba en móvil** para responsive design

## 🔧 Solución de Problemas

### Error: "Permission denied" en Google Sheets
- **Causa**: La Service Account no tiene permisos
- **Solución**: Comparte el Google Sheet con el email de la Service Account

### Error: "GOOGLE_SHEET_ID not found"
- **Causa**: Variable de entorno no configurada en Vercel
- **Solución**: Agrega `GOOGLE_SHEET_ID` en Vercel Environment Variables

### Error CORS en el frontend
- **Causa**: `ALLOWED_ORIGINS` no incluye la URL de Netlify
- **Solución**: Actualiza `ALLOWED_ORIGINS` en Vercel con la URL de Netlify

### El frontend no se conecta al backend
- **Causa**: `VITE_API_URL` incorrecto en Netlify
- **Solución**: Verifica que apunte a tu backend en Vercel

### Backend no inicia en Vercel
- **Causa**: Error en `service_account.json` o dependencias
- **Solución**: Revisa los logs en Vercel (Deployments → Función → Logs)

## 📝 Resumen de URLs

| Servicio | URL | Propósito |
|----------|-----|-----------|
| **GitHub** | `github.com/tu-usuario/compras-app` | Código fuente |
| **Vercel (Backend)** | `https://compras-app-backend.vercel.app` | API FastAPI |
| **Netlify (Frontend)** | `https://compras-app.netlify.app` | Interfaz React |
| **Google Sheets** | Tu spreadsheet | Base de datos |
| **Google Cloud** | `console.cloud.google.com` | Service Account |

## 🎯 Próximos Pasos

1. **Dominio personalizado** (opcional):
   - Compra un dominio
   - Configúralo en Netlify y Vercel

2. **Monitoreo**:
   - Agrega logging estructurado
   - Usa Sentry para tracking de errores

3. **Mejoras de seguridad**:
   - Implementa autenticación
   - Agrega rate limiting
   - Valida y sanitiza todos los inputs

4. **Backup de datos**:
   - Configura exportación automática de Google Sheets
   - Usa Google Drive para backups

## 📚 Recursos Adicionales

- [Documentación de Vercel para Python](https://vercel.com/docs/runtimes#official-runtimes/python)
- [Documentación de Netlify para React](https://docs.netlify.com/frameworks/react/)
- [Documentación de gspread](https://docs.gspread.org/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

**¡Listo! Tu aplicación de gestión de compras está en producción.** 🎉

## 🔄 Actualizaciones Futuras

Para actualizar la aplicación:

```bash
# Hacer cambios en el código
git add .
git commit -m "Descripción de los cambios"
git push origin main
```

- **Vercel** y **Netlify** detectarán automáticamente los cambios y desplegarán la nueva versión.
- Los despliegues son automáticos en la rama `main`.