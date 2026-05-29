/**
 * hooks/useApi.js
 * Hook genérico para llamadas a la API con estado de carga y error.
 * Evita duplicar lógica de loading/error en cada componente.
 */

import { useState, useEffect, useCallback } from "react";

/**
 * @param {Function} apiFn - Función del cliente API a ejecutar
 * @param {Array}    deps  - Dependencias que relanzan la llamada (como useEffect)
 * @param {Object}   opts  - { immediate: bool, transform: fn }
 */
export function useApi(apiFn, deps = [], opts = {}) {
  const { immediate = true, transform = (d) => d } = opts;

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      const transformed = transform(res.data);
      setData(transformed);
      return transformed;
    } catch (err) {
      setError(err.userMessage || "Error al cargar datos.");
      return null;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) execute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  return { data, loading, error, refetch: execute };
}
