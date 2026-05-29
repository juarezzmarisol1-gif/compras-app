import { useState } from "react";
import toast from "react-hot-toast";
import { useApi } from "../hooks/useApi";
import { getSemanaActual, getPlanificacion, updateEstado } from "../api/client";
import "./Checklist.css";

const DIAS_ORDEN = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export default function Checklist() {
  const { data: semanaInfo } = useApi(getSemanaActual, [], { transform: (d) => d });
  const semana = semanaInfo?.semana;

  const { data, loading, refetch } = useApi(
    () => getPlanificacion(semana),
    [semana],
    {
      immediate: !!semana,
      transform: (d) => d.items ?? [],
    }
  );

  const [updating, setUpdating] = useState(null);   // ID del ítem que está cargando

  // ── Agrupar por día ───────────────────────────────────────────────────────
  const porDia = {};
  (data || []).forEach((item) => {
    const dia = item.DiaSeleccionado;
    if (!porDia[dia]) porDia[dia] = [];
    porDia[dia].push(item);
  });

  const diasOrdenados = DIAS_ORDEN.filter((d) => porDia[d]);

  // ── Métricas ──────────────────────────────────────────────────────────────
  const total    = (data || []).length;
  const hechos   = (data || []).filter((i) => i.EstadoPedido === "Realizado").length;
  const progreso = total > 0 ? Math.round((hechos / total) * 100) : 0;

  // ── Toggle estado ─────────────────────────────────────────────────────────
  async function handleToggle(item) {
    const nuevoEstado = item.EstadoPedido === "Realizado" ? "Pendiente" : "Realizado";
    setUpdating(item.ID);
    try {
      await updateEstado(item.ID, nuevoEstado);
      toast.success(
        nuevoEstado === "Realizado"
          ? `✓ ${item.NombreProveedor} marcado como realizado`
          : `↩ ${item.NombreProveedor} marcado como pendiente`,
        { duration: 2000 }
      );
      refetch();
    } finally {
      setUpdating(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Checklist semanal</h1>
          <p className="page-subtitle">
            {semana ? `Semana ${semana}` : "Cargando…"}
            {total > 0 && ` · ${hechos}/${total} pedidos realizados`}
          </p>
        </div>
      </div>

      {/* ── Barra de progreso ─────────────────────────────────────────── */}
      {total > 0 && (
        <div className="progress-card card">
          <div className="progress-top">
            <span className="progress-label">Progreso de la semana</span>
            <span className="progress-pct">{progreso}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progreso}%` }} />
          </div>
          <div className="progress-stats">
            <span><strong>{hechos}</strong> realizados</span>
            <span><strong>{total - hechos}</strong> pendientes</span>
            <span><strong>{total}</strong> total</span>
          </div>
        </div>
      )}

      {/* ── Lista agrupada por día ────────────────────────────────────── */}
      {loading ? (
        <div className="loading-center"><span className="spinner" /> Cargando planificación…</div>
      ) : total === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">📋</div>
          <p>No hay pedidos planificados para la semana {semana}.</p>
          <p style={{ fontSize: 13 }}>Cargá la planificación en la sección <strong>Planificación</strong>.</p>
        </div>
      ) : (
        <div className="checklist-groups">
          {diasOrdenados.map((dia) => (
            <div key={dia} className="dia-group card">
              <div className="dia-group-header">
                <span className="dia-group-title">{dia}</span>
                <span className="dia-group-count badge badge-blue">
                  {porDia[dia].filter((i) => i.EstadoPedido === "Realizado").length}/{porDia[dia].length}
                </span>
              </div>

              <div className="checklist-items">
                {porDia[dia].map((item) => {
                  const isHecho   = item.EstadoPedido === "Realizado";
                  const isLoading = updating === item.ID;

                  return (
                    <div
                      key={item.ID}
                      className={"checklist-item" + (isHecho ? " checklist-item--done" : "")}
                      onClick={() => !isLoading && handleToggle(item)}
                    >
                      <div className={"check-box" + (isHecho ? " check-box--checked" : "")}>
                        {isLoading
                          ? <span className="spinner" style={{ width: 14, height: 14 }} />
                          : isHecho ? "✓" : ""}
                      </div>

                      <div className="item-info">
                        <span className="item-nombre">{item.NombreProveedor}</span>
                        <span className="item-un">{item.NombreUnidadNegocio}</span>
                      </div>

                      <span className={"badge " + (isHecho ? "badge-green" : "badge-amber")}>
                        {isHecho ? "Realizado" : "Pendiente"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
