/**
 * api/client.js
 * Cliente Axios centralizado.
 * Todos los módulos importan las funciones de acá, nunca llaman axios directamente.
 */

import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Interceptor de errores ────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail;
    let msg = "Error inesperado. Intentá de nuevo.";

    if (typeof detail === "string") {
      msg = detail;
    } else if (detail?.message) {
      msg = detail.message;
    } else if (err.message) {
      msg = err.message;
    }

    // Toast automático para errores 4xx/5xx (se puede deshabilitar por llamada)
    if (!err.config?.silentError) {
      toast.error(msg, { duration: 4000 });
    }

    return Promise.reject({ ...err, userMessage: msg });
  }
);

// ── Proveedores ───────────────────────────────────────────────────────────────

export const getProveedores   = ()       => api.get("/proveedores/");
export const getProveedor     = (id)     => api.get(`/proveedores/${id}`);
export const createProveedor  = (data)   => api.post("/proveedores/", data);
export const updateProveedor  = (id, d)  => api.put(`/proveedores/${id}`, d);
export const deleteProveedor  = (id)     => api.delete(`/proveedores/${id}`);

// ── Unidades de Negocio ───────────────────────────────────────────────────────

export const getUnidades      = ()       => api.get("/unidades/");
export const createUnidad     = (data)   => api.post("/unidades/", data);
export const updateUnidad     = (id, d)  => api.put(`/unidades/${id}`, d);

// ── Planificación ─────────────────────────────────────────────────────────────

export const getSemanaActual    = ()       => api.get("/planificacion/semana-actual");
export const getPlanificacion   = (semana) => api.get(`/planificacion/${semana}`);
export const createPlanificacion = (data) => api.post("/planificacion/", data);
export const createPlanificacionBulk = (items) =>
  api.post("/planificacion/bulk", { items });
export const updateEstado       = (id, estado) =>
  api.patch(`/planificacion/${id}/estado`, { EstadoPedido: estado });
