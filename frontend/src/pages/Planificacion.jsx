import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { useApi } from "../hooks/useApi";
import {
  getSemanaActual, getProveedores, getUnidades,
  createPlanificacionBulk, getPlanificacion,
} from "../api/client";
import "./Planificacion.css";

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

function formatDate(d) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatISO(d) {
  return d.toISOString().split("T")[0];
}

const DAY_NAMES = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
const DAY_SHORT = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];

export default function Planificacion() {
  const { data: semanaInfo } = useApi(getSemanaActual, [], { transform: (d) => d });
  const { data: proveedores } = useApi(getProveedores, [], { transform: (d) => d.items ?? [] });
  const { data: unidades } = useApi(getUnidades, [], { transform: (d) => d.items ?? [] });

  const semana = semanaInfo?.semana;

  // ── Rango de fechas ──────────────────────────────────────────────────────
  const mondayOfThisWeek = useMemo(() => getMonday(new Date()), []);
  const [fechaInicio, setFechaInicio] = useState(formatISO(mondayOfThisWeek));

  const fechaFin = useMemo(() => {
    const start = new Date(fechaInicio + "T12:00:00");
    const end = new Date(start);
    end.setDate(start.getDate() + 5); // 6 días (Lu a Sa)
    return formatISO(end);
  }, [fechaInicio]);

  // Generar días del rango
  const dias = useMemo(() => {
    const result = [];
    const start = new Date(fechaInicio + "T12:00:00");
    for (let i = 0; i < 6; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      result.push({
        dia: DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1],
        fecha: formatDate(d),
        dayIndex: d.getDay() === 0 ? 6 : d.getDay() - 1,
      });
    }
    return result;
  }, [fechaInicio]);

  // ── Estado de la grilla ──────────────────────────────────────────────────
  const [grilla, setGrilla] = useState({});
  const [unidadSel, setUnidadSel] = useState("");
  const [saving, setSaving] = useState(false);
  const [yaGuardado, setYaGuardado] = useState(false);

  useEffect(() => {
    setGrilla(Object.fromEntries(dias.map(({ dia }) => [dia, null])));
  }, [dias]);

  useEffect(() => {
    if (semana && unidadSel) {
      getPlanificacion(semana).then((res) => {
        const items = res.data.items ?? [];
        const deEstaUN = items.filter((i) => i.UnidadNegocioID === unidadSel);
        if (deEstaUN.length > 0) setYaGuardado(true);
        else setYaGuardado(false);
      });
    }
  }, [semana, unidadSel]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function getProveedorById(id) {
    return (proveedores || []).find((p) => p.ID === id);
  }

  function handleAsignar(dia, proveedorId) {
    if (!proveedorId) {
      setGrilla((prev) => ({ ...prev, [dia]: null }));
      return;
    }

    const prov = getProveedorById(proveedorId);
    if (!prov) return;

    const diasPermitidos = (prov.DiasEntrega || "")
      .split(",").map((d) => d.trim());

    if (!diasPermitidos.includes(dia)) {
      toast.error(
        `${prov.NombreFantasia} no entrega los ${dia}.\nDías disponibles: ${diasPermitidos.join(", ")}.`,
        { duration: 5000 }
      );
      setGrilla((prev) => ({ ...prev, [dia]: null }));
      return;
    }

    setGrilla((prev) => ({
      ...prev,
      [dia]: { proveedorId, proveedorNombre: prov.NombreFantasia },
    }));
  }

  async function handleGuardar() {
    if (!unidadSel) { toast.error("Seleccioná una Unidad de Negocio."); return; }

    const items = Object.entries(grilla)
      .filter(([, v]) => v !== null)
      .map(([dia, v]) => ({
        SemanaCodigo: semana,
        UnidadNegocioID: unidadSel,
        ProveedorID: v.proveedorId,
        DiaSeleccionado: dia,
      }));

    if (!items.length) { toast.error("Asigná al menos un proveedor."); return; }

    setSaving(true);
    try {
      const res = await createPlanificacionBulk(items);
      toast.success(res.data.message);
      setYaGuardado(true);
    } catch (err) {
      const errores = err.response?.data?.detail?.errores;
      if (errores) {
        errores.forEach((e) => toast.error(`${e.proveedor ?? "Ítem"}: ${e.error}`));
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  const asignados = Object.values(grilla).filter(Boolean).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Planificación semanal</h1>
          <p className="page-subtitle">
            {semana
              ? `Semana ${semana} · ${asignados} proveedor${asignados !== 1 ? "es" : ""} asignado${asignados !== 1 ? "s" : ""}`
              : "Cargando semana…"}
          </p>
        </div>
      </div>

      {/* ── Selector de UN y rango de fechas ────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field" style={{ flex: "1 1 250px" }}>
            <label>Unidad de negocio</label>
            <select className="input" value={unidadSel}
              onChange={(e) => setUnidadSel(e.target.value)}>
              <option value="">— Seleccioná una unidad —</option>
              {(unidades || []).map((u) => (
                <option key={u.ID} value={u.ID}>{u.NombreUnidad}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: "1 1 160px" }}>
            <label>Fecha inicio</label>
            <input
              type="date"
              className="input"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: "1 1 160px" }}>
            <label>Fecha fin</label>
            <input
              type="date"
              className="input"
              value={fechaFin}
              disabled
            />
          </div>
        </div>
        {yaGuardado && (
          <div className="alert alert-amber" style={{ marginTop: 12 }}>
            ⚠️ Ya existe planificación guardada para esta UN en la semana {semana}. Podés agregar más días.
          </div>
        )}
      </div>

      {/* ── Grilla semanal ─────────────────────────────────────────────── */}
      <div className="card grilla-card">
        <div className="grilla-header">
          <span className="grilla-label">Grilla de la semana</span>
          <span className="grilla-hint">
            {unidadSel
              ? "Seleccioná un proveedor en cada día"
              : "Primero seleccioná una Unidad de Negocio arriba"}
          </span>
        </div>

        <div className="grilla">
          {dias.map(({ dia, fecha }) => {
            const asignacion = grilla[dia];
            const provs = (proveedores || []).filter((p) => {
              const dp = (p.DiasEntrega || "").split(",").map((d) => d.trim());
              return dp.includes(dia);
            });

            return (
              <div key={dia} className={"grilla-col" + (asignacion ? " grilla-col--assigned" : "")}>
                <div className="grilla-day">
                  <span className="day-name">{DAY_SHORT[dias.findIndex(d => d.dia === dia)]}</span>
                  <span className="day-date">{fecha}</span>
                </div>

                <select
                  className="input grilla-select"
                  value={asignacion?.proveedorId ?? ""}
                  onChange={(e) => handleAsignar(dia, e.target.value)}
                >
                  <option value="">—</option>
                  {provs.map((p) => (
                    <option key={p.ID} value={p.ID}>{p.NombreFantasia}</option>
                  ))}
                  {provs.length === 0 && <option disabled>Sin proveedores</option>}
                </select>

                {asignacion && (
                  <div className="grilla-assigned-badge">
                    ✓ {asignacion.proveedorNombre}
                  </div>
                )}
                {!asignacion && (
                  <div className="grilla-empty-hint">
                    {provs.length} proveedor{provs.length !== 1 ? "es" : ""} disp.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grilla-footer">
          <button className="btn btn-primary" onClick={handleGuardar} disabled={saving || !unidadSel}>
            {saving
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Guardando…</>
              : `💾 Guardar planificación — Semana ${semana ?? "…"}`}
          </button>
        </div>
      </div>
    </div>
  );
}