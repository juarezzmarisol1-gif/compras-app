import { useState } from "react";
import toast from "react-hot-toast";
import { useApi } from "../hooks/useApi";
import {
  getProveedores, createProveedor, updateProveedor, deleteProveedor,
} from "../api/client";
import "./Proveedores.css";

const DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

const EMPTY_FORM = {
  NombreFantasia: "", RazonSocial: "", Contacto: "", Telefono: "",
  Rubro: "", DiasEntrega: [], HorariosPedido: "", MinimoCompra: "",
};

export default function Proveedores() {
  const { data, loading, refetch } = useApi(getProveedores, [], {
    transform: (d) => d.items ?? [],
  });

  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);   // proveedor completo o null
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(prov) {
    setEditing(prov);
    setForm({
      ...prov,
      DiasEntrega: (prov.DiasEntrega || "").split(",").map((d) => d.trim()).filter(Boolean),
    });
    setShowForm(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleDia(dia) {
    setForm((prev) => {
      const current = prev.DiasEntrega;
      return {
        ...prev,
        DiasEntrega: current.includes(dia)
          ? current.filter((d) => d !== dia)
          : [...current, dia],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.DiasEntrega.length) {
      toast.error("Seleccioná al menos un día de entrega.");
      return;
    }
    setSaving(true);
    const payload = { ...form, DiasEntrega: form.DiasEntrega.join(",") };
    try {
      if (editing) {
        await updateProveedor(editing.ID, payload);
        toast.success("Proveedor actualizado.");
      } else {
        await createProveedor(payload);
        toast.success("Proveedor creado.");
      }
      setShowForm(false);
      refetch();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(prov) {
    if (!confirm(`¿Eliminar a ${prov.NombreFantasia}?`)) return;
    await deleteProveedor(prov.ID);
    toast.success("Proveedor eliminado.");
    refetch();
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-subtitle">Master data — altas, bajas y modificaciones</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Nuevo proveedor
        </button>
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────── */}
      <div className="card">
        {loading ? (
          <div className="loading-center"><span className="spinner" /> Cargando...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre fantasía</th>
                  <th>Razón social</th>
                  <th>Rubro</th>
                  <th>Días entrega</th>
                  <th>Mínimo</th>
                  <th>Teléfono</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data || []).length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--c-text-3)" }}>
                    Sin proveedores. Creá el primero.
                  </td></tr>
                ) : (
                  (data || []).map((p) => (
                    <tr key={p.ID}>
                      <td><strong>{p.NombreFantasia}</strong></td>
                      <td>{p.RazonSocial}</td>
                      <td>{p.Rubro || "—"}</td>
                      <td>
                        <div className="dias-chips">
                          {(p.DiasEntrega || "").split(",").map((d) => (
                            <span key={d} className="badge badge-green">{d.trim()}</span>
                          ))}
                        </div>
                      </td>
                      <td>{p.MinimoCompra ? `$${p.MinimoCompra}` : "—"}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                        {p.Telefono ? (
                          <a
                            href={`https://wa.me/${p.Telefono.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--c-primary)", textDecoration: "none", cursor: "pointer" }}
                            title="Abrir chat de WhatsApp"
                          >
                            📱 {p.Telefono}
                          </a>
                        ) : "—"}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: "13px" }}
                            onClick={() => openEdit(p)}>Editar</button>
                          <button className="btn btn-danger" style={{ padding: "5px 10px", fontSize: "13px" }}
                            onClick={() => handleDelete(p)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal / Formulario ────────────────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? "Editar proveedor" : "Nuevo proveedor"}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="prov-form">
              <div className="form-grid">
                <div className="field">
                  <label>Nombre fantasía *</label>
                  <input className="input" name="NombreFantasia" value={form.NombreFantasia}
                    onChange={handleChange} required />
                </div>
                <div className="field">
                  <label>Razón social *</label>
                  <input className="input" name="RazonSocial" value={form.RazonSocial}
                    onChange={handleChange} required />
                </div>
                <div className="field">
                  <label>Contacto</label>
                  <input className="input" name="Contacto" value={form.Contacto}
                    onChange={handleChange} />
                </div>
                <div className="field">
                  <label>Teléfono</label>
                  <input className="input" name="Telefono" value={form.Telefono}
                    onChange={handleChange} />
                </div>
                <div className="field">
                  <label>Rubro</label>
                  <input className="input" name="Rubro" value={form.Rubro}
                    onChange={handleChange} />
                </div>
                <div className="field">
                  <label>Compra mínima ($)</label>
                  <input className="input" name="MinimoCompra" value={form.MinimoCompra}
                    onChange={handleChange} />
                </div>
                <div className="field">
                  <label>Horarios de pedido</label>
                  <input className="input" name="HorariosPedido" value={form.HorariosPedido}
                    onChange={handleChange} placeholder="Ej: Lunes a Viernes 8-17hs" />
                </div>
              </div>

              <div className="field">
                <label>Días de entrega *</label>
                <div className="dias-selector">
                  {DIAS.map((dia) => (
                    <button key={dia} type="button"
                      className={"dia-btn" + (form.DiasEntrega.includes(dia) ? " dia-btn--active" : "")}
                      onClick={() => toggleDia(dia)}>
                      {dia.slice(0, 2)}
                    </button>
                  ))}
                </div>
                <span className="field-hint">
                  {form.DiasEntrega.length > 0
                    ? form.DiasEntrega.join(", ")
                    : "Ningún día seleccionado"}
                </span>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:14,height:14}}/> Guardando…</> : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
