import { useSearchParams } from "react-router";
import { EmployeePicker } from "../components/EmployeePicker";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { admin, supervisor } from "../lib/types";
import type { RecordData } from "../lib/types";
import { download, id, money, month, query } from "../lib/api";
import {
  Badge,
  Details,
  Editor,
  f,
  Head,
  Icon,
  Modal,
  Notice,
  Pager,
  Refresh,
  Resource,
  stateColumn,
  Table,
  Tabs,
  useAction,
  useResource,
} from "../components/ui";
export function Payroll() {
  const { api, user } = useAuth();
  const boss = supervisor(user);
  const [params] = useSearchParams();
  const [tab, setTab] = useState("nominas");
  const [period, setPeriod] = useState(month());
  const [employee, setEmployee] = useState(
    boss ? params.get("empleado") || "" : user.empleado_id || "",
  );
  const [cursor, setCursor] = useState("");
  const [form, setForm] = useState("");
  const [selected, setSelected] = useState("");
  const action = useAction();
  const [message, setMessage] = useState("");
  const path =
    tab === "liquidacion"
      ? "/nominas/liquidaciones/" + id(employee || user.empleado_id || "")
      : tab === "planillas"
        ? "/nominas/planillas" + query({ limit: 20, next_token: cursor })
        : tab === "conceptos"
          ? "/nominas/conceptos" +
            query({
              periodo: period,
              empleado_id: employee,
              limit: 30,
              next_token: cursor,
            })
          : employee
            ? "/nominas/empleado/" +
              id(employee) +
              query({ limit: 30, next_token: cursor })
            : "/nominas" +
              query({ periodo: period, limit: 30, next_token: cursor });
  const state = useResource(
    (s) =>
      (!boss || tab === "liquidacion") && !employee
        ? Promise.resolve(null)
        : api("nominas", path, { signal: s }),
    [api, path, boss, employee],
  );
  const summary = useResource(
    (s) =>
      boss
        ? api("nominas", "/nominas/resumen" + query({ periodo: period }), {
            signal: s,
          })
        : Promise.resolve(null),
    [api, boss, period],
  );
  const detail = useResource(
    (s) =>
      selected
        ? api(
            "nominas",
            selected.startsWith("period:")
              ? "/nominas/planillas/" + id(selected.slice(7))
              : "/nominas/" + id(selected),
            { signal: s },
          )
        : Promise.resolve(null),
    [api, selected],
  );
  const reloadSummary = summary.reload;
  const reloadState = state.reload;
  useEffect(() => {
    if (summary.data?.estado !== "EN_PROCESO") return;
    const t = setInterval(() => {
      reloadSummary();
      reloadState();
    }, 5000);
    return () => clearInterval(t);
  }, [summary.data?.estado, reloadSummary, reloadState]);
  const page = tab === "nominas" && employee ? state.data?.nominas : state.data;
  const rows = page?.items || [];
  const tabs: [string, string][] = [
    ["nominas", "Boletas"],
    ...(boss ? [["planillas", "Planillas"] as [string, string]] : []),
    ["conceptos", "Bonos y descuentos"],
    ["liquidacion", "Liquidación"],
  ];
  const refresh = () => {
    state.reload();
    summary.reload();
  };
  return (
    <>
      <Head
        title="Nóminas"
        description="Compensaciones claras. Cada periodo, en un solo lugar."
      >
        <Refresh onClick={refresh} />
        {admin(user) && (
          <button
            className="button primary"
            onClick={() =>
              setForm(tab === "conceptos" ? "concept" : "generate")
            }
          >
            <Icon name="plus" />
            {tab === "conceptos" ? "Nuevo concepto" : "Generar planilla"}
          </button>
        )}
      </Head>
      {action.notice}
      <Notice text={message} />
      {boss && (
        <Resource state={summary}>
          {summary.data && (
            <div className="stats">
              <div className="stat">
                <span>Periodo {period}</span>
                <strong>
                  {summary.data.estado
                    ? money(summary.data.total_neto)
                    : "Sin planilla"}
                </strong>
                <small>Total neto</small>
              </div>
              <div className="stat">
                <span>Procesados</span>
                <strong>{summary.data.procesados}</strong>
                <small>Empleados en la planilla</small>
              </div>
              <div className="stat">
                <span>Estado del proceso</span>
                <strong className="stat-status">
                  <Badge value={summary.data.estado || "SIN_GENERAR"} />
                </strong>
                <small>
                  {summary.data.estado === "EN_PROCESO"
                    ? "Actualización automática cada 5 segundos"
                    : "Información del backend"}
                </small>
              </div>
            </div>
          )}
        </Resource>
      )}
      <section className="panel">
        <Tabs
          items={tabs}
          value={tab}
          onChange={(v) => {
            setTab(v);
            setCursor("");
          }}
        />
        <div className="toolbar">
          {!["planillas", "liquidacion"].includes(tab) && (
            <label>
              Periodo
              <input
                type="month"
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value);
                  setCursor("");
                }}
                required
              />
            </label>
          )}
          {boss && tab !== "planillas" && (
            <label>
              Empleado
              <EmployeePicker
                value={employee}
                onChange={(value) => {
                  setEmployee(value);
                  setCursor("");
                }}
              />
            </label>
          )}
          {employee && tab === "nominas" && (
            <small>Historial de todos los periodos del empleado.</small>
          )}
        </div>
        {!boss && !employee ? (
          <Notice text="Se requiere una cuenta vinculada a un empleado." />
        ) : (
          <Resource
            state={state}
            empty={tab === "liquidacion" ? !state.data : !rows.length}
          >
            {tab === "liquidacion" ? (
              <div className="padded">
                <Details
                  record={state.data || {}}
                  fields={[
                    ["empleado_id", "Empleado"],
                    ["fecha_cese", "Fecha de cese"],
                    ["vacaciones_truncas", "Vacaciones truncas (PEN)"],
                    ["cts_trunca", "CTS trunca (PEN)"],
                    ["gratificacion_trunca", "Gratificación trunca (PEN)"],
                    ["total", "Total (PEN)"],
                  ]}
                />
              </div>
            ) : (
              <Table
                rows={rows}
                rowKey={
                  tab === "planillas"
                    ? "periodo"
                    : tab === "conceptos"
                      ? "concepto_id"
                      : "nomina_id"
                }
                columns={
                  tab === "planillas"
                    ? [
                        { key: "periodo", title: "Periodo" },
                        { key: "procesados", title: "Procesados" },
                        {
                          key: "total_neto",
                          title: "Total neto",
                          render: (r) => money(r.total_neto),
                        },
                        stateColumn,
                      ]
                    : tab === "conceptos"
                      ? [
                          { key: "empleado_id", title: "Empleado" },
                          { key: "concepto", title: "Concepto" },
                          { key: "tipo", title: "Tipo" },
                          {
                            key: "monto",
                            title: "Monto",
                            render: (r) => money(r.monto),
                          },
                          { key: "origen", title: "Origen" },
                        ]
                      : [
                          {
                            key: "nombre_empleado",
                            title: "Empleado",
                            render: (r) => (
                              <div>
                                <strong>
                                  {r.nombre_empleado || r.empleado_id}
                                </strong>
                                <small className="block muted">
                                  {r.empleado_id}
                                </small>
                              </div>
                            ),
                          },
                          { key: "periodo", title: "Periodo" },
                          {
                            key: "neto",
                            title: "Neto",
                            render: (r) => <strong>{money(r.neto)}</strong>,
                          },
                          stateColumn,
                        ]
                }
                actions={
                  tab === "conceptos"
                    ? undefined
                    : (r) =>
                        tab === "planillas" ? (
                          <button
                            className="text-button"
                            onClick={() => setSelected("period:" + r.periodo)}
                          >
                            Ver proceso
                          </button>
                        ) : (
                          <>
                            <button
                              className="text-button"
                              onClick={() => setSelected(r.nomina_id)}
                            >
                              Detalle
                            </button>
                            <button
                              className="button secondary small"
                              disabled={action.busy}
                              onClick={() =>
                                action.run(async () => {
                                  download(
                                    await api<Blob>(
                                      "nominas",
                                      "/nominas/" + id(r.nomina_id) + "/boleta",
                                      { format: "pdf" },
                                    ),
                                    "boleta-" +
                                      r.periodo +
                                      "-" +
                                      r.empleado_id +
                                      ".pdf",
                                  );
                                }, "Descarga iniciada.")
                              }
                            >
                              <Icon name="download" size={16} />
                              PDF
                            </button>
                          </>
                        )
                }
              />
            )}
          </Resource>
        )}
        {tab !== "liquidacion" && (
          <Pager
            next={page?.next_token}
            cursor={cursor}
            onPage={setCursor}
            count={rows.length}
          />
        )}
      </section>
      {state.data?.liquidacion && (
        <section className="panel padded">
          <h2>Liquidación</h2>
          <Details
            record={state.data.liquidacion}
            fields={[
              ["fecha_cese", "Fecha de cese"],
              ["vacaciones_truncas", "Vacaciones truncas"],
              ["cts_trunca", "CTS trunca"],
              ["gratificacion_trunca", "Gratificación trunca"],
              ["total", "Total (PEN)"],
            ]}
          />
        </section>
      )}
      {selected && (
        <Modal
          title={
            selected.startsWith("period:")
              ? "Proceso de planilla"
              : "Detalle de boleta"
          }
          onClose={() => setSelected("")}
        >
          <Resource state={detail}>
            {detail.data && (
              <>
                <Details
                  record={detail.data}
                  fields={
                    selected.startsWith("period:")
                      ? [
                          ["periodo", "Periodo"],
                          ["estado", "Estado"],
                          ["procesados", "Procesados"],
                          ["total_empleados", "Empleados"],
                          ["total_bruto", "Bruto (PEN)"],
                          ["total_descuentos", "Descuentos (PEN)"],
                          ["total_neto", "Neto (PEN)"],
                          ["mensaje_error", "Error de procesamiento"],
                        ]
                      : [
                          ["nombre_empleado", "Empleado"],
                          ["periodo", "Periodo"],
                          ["dias_laborados", "Días laborados"],
                          ["sueldo_base", "Sueldo base (PEN)"],
                          ["bonos", "Bonos (PEN)"],
                          ["descuentos", "Descuentos (PEN)"],
                          ["neto", "Neto (PEN)"],
                          ["aporte_essalud", "Aporte EsSalud (PEN)"],
                        ]
                  }
                />
                {detail.data.detalle?.length > 0 && (
                  <Table
                    rows={detail.data.detalle}
                    columns={[
                      { key: "concepto", title: "Concepto" },
                      { key: "tipo", title: "Tipo" },
                      {
                        key: "monto",
                        title: "Monto",
                        render: (r) => money(r.monto),
                      },
                    ]}
                  />
                )}
                <footer>
                  <Refresh onClick={detail.reload} />
                </footer>
              </>
            )}
          </Resource>
        </Modal>
      )}
      {form && (
        <Editor
          title={
            form === "generate" ? "Generar planilla" : "Registrar concepto"
          }
          initial={{
            periodo: period,
            empleado_id: employee,
            notificar: true,
            forzar: false,
          }}
          description={
            form === "generate"
              ? "Esta operación procesa la planilla de toda la empresa. Si activas notificaciones, el backend enviará avisos. Recalcular reemplaza las nóminas del periodo."
              : "Los conceptos se incorporan al generar o recalcular la planilla."
          }
          fields={
            form === "generate"
              ? [
                  f("periodo", "Periodo", { type: "month" }),
                  f("notificar", "Enviar notificaciones a empleados", {
                    type: "checkbox",
                  }),
                  f("forzar", "Recalcular si la planilla ya existe", {
                    type: "checkbox",
                  }),
                ]
              : [
                  f("empleado_id", "Empleado"),
                  f("periodo", "Periodo", { type: "month" }),
                  f("tipo", "Tipo", { options: ["BONO", "DESCUENTO"] }),
                  f("concepto", "Concepto", { maxLength: 120 }),
                  f("monto", "Monto (PEN)", {
                    type: "number",
                    min: 0.01,
                    step: 0.01,
                  }),
                ]
          }
          onClose={() => setForm("")}
          submit={
            form === "generate" ? "Iniciar generación" : "Guardar concepto"
          }
          onSave={async (body) => {
            if (
              form === "generate" &&
              !window.confirm(
                (body.forzar
                  ? "¿Confirmas recalcular y reemplazar las nóminas de "
                  : "¿Confirmas generar la planilla de ") +
                  body.periodo +
                  " para toda tu empresa? " +
                  (body.notificar
                    ? "Se enviarán notificaciones a los empleados."
                    : "No se solicitarán notificaciones a los empleados."),
              )
            )
              throw Error("Operación cancelada.");
            await api(
              "nominas",
              form === "generate" ? "/nominas/generar" : "/nominas/conceptos",
              { method: "POST", body },
            );
            setMessage(
              form === "generate"
                ? "Solicitud de planilla aceptada. Revisa el estado del periodo: el procesamiento puede continuar en segundo plano."
                : "Concepto guardado. Se aplicará al generar o recalcular la planilla del periodo.",
            );
            setPeriod(body.periodo);
            refresh();
          }}
        />
      )}
    </>
  );
}
export function Bands() {
  const { api, user } = useAuth();
  const [edit, setEdit] = useState<RecordData | null>(null);
  const state = useResource(
    (s) => api("nominas", "/bandas", { signal: s }),
    [api],
  );
  return (
    <>
      <Head
        title="Bandas salariales"
        description="Referencias de compensación por cargo."
      >
        <Refresh onClick={state.reload} />
        {admin(user) && (
          <button
            className="button primary"
            onClick={() => setEdit({ moneda: "PEN" })}
          >
            <Icon name="plus" />
            Nueva banda
          </button>
        )}
      </Head>
      <section className="panel">
        <Resource state={state} empty={!state.data?.items?.length}>
          <Table
            rows={state.data?.items || []}
            rowKey="cargo"
            columns={[
              { key: "cargo", title: "Cargo" },
              {
                key: "minimo",
                title: "Mínimo",
                render: (r) => money(r.minimo, r.moneda),
              },
              {
                key: "maximo",
                title: "Máximo",
                render: (r) => money(r.maximo, r.moneda),
              },
              { key: "moneda", title: "Moneda" },
            ]}
            actions={
              admin(user)
                ? (r) => (
                    <button className="text-button" onClick={() => setEdit(r)}>
                      Editar
                    </button>
                  )
                : undefined
            }
          />
        </Resource>
      </section>
      {edit && (
        <Editor
          title={edit.cargo ? "Editar banda salarial" : "Nueva banda salarial"}
          initial={edit}
          fields={[
            f("cargo", "Cargo", { readOnly: !!edit.cargo, maxLength: 120 }),
            f("minimo", "Mínimo", { type: "number", min: 0, step: 0.01 }),
            f("maximo", "Máximo", { type: "number", min: 0, step: 0.01 }),
            f("moneda", "Moneda", { options: ["PEN", "USD", "EUR"] }),
          ]}
          onClose={() => setEdit(null)}
          onSave={async (body) => {
            if (body.minimo > body.maximo)
              throw Error("El mínimo no puede superar el máximo.");
            await api("nominas", "/bandas", { method: "PUT", body });
            state.reload();
          }}
        />
      )}
    </>
  );
}
