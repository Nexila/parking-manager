import React, { useEffect as reactUseEffect, useMemo, useState } from "react";
import { api } from "./api";
import {
  CAPACITY,
  currentMonth,
  today,
  shiftMonth,
  monthLabel,
  inr,
  active,
  paid,
  pending,
  deposit,
  late,
  sum,
} from "./utils";
const blankTenant = (m) => ({
  name: "",
  phone: "",
  car: "",
  slot: "",
  start: m,
  rent: "",
  deposit: 0,
});
const useEffect = (effect, dependencies) =>
  reactUseEffect(() => {
    effect();
  }, dependencies);
function Modal({ children, onClose }) {
  return (
    <div
      className="ov"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet">{children}</div>
    </div>
  );
}
function TenantForm({ tenant, tenants, month, onClose, onSave }) {
  const [form, setForm] = useState(tenant || blankTenant(month));
  const set = (key, value) => setForm({ ...form, [key]: value });
  const used = new Set(
    tenants.filter((t) => t._id !== tenant?._id && !t.end).map((t) => t.slot),
  );
  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !Number(form.rent))
      return alert("Enter a name and monthly rent.");
    await onSave({
      ...form,
      name: form.name.trim(),
      car: form.car.trim().toUpperCase(),
      slot: Number(form.slot),
      rent: Number(form.rent),
      deposit: Number(form.deposit || 0),
    });
    onClose();
  }
  return (
    <Modal onClose={onClose}>
      <h1>{tenant ? "Edit tenant" : "New tenant"}</h1>
      <form onSubmit={submit}>
        <label>Name</label>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        <div className="two">
          <div>
            <label>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div>
            <label>Car number</label>
            <input
              value={form.car}
              onChange={(e) => set("car", e.target.value)}
            />
          </div>
        </div>
        <div className="two">
          <div>
            <label>Slot</label>
            <select
              value={form.slot}
              onChange={(e) => set("slot", e.target.value)}
            >
              <option value="">Select</option>
              {Array.from({ length: CAPACITY }, (_, i) => i + 1)
                .filter((n) => !used.has(n) || n === tenant?.slot)
                .map((n) => (
                  <option key={n}>{n}</option>
                ))}
            </select>
          </div>
          <div>
            <label>Start month</label>
            <input
              type="month"
              value={form.start}
              onChange={(e) => set("start", e.target.value)}
            />
          </div>
        </div>
        <div className="two">
          <div>
            <label>Monthly rent (₹)</label>
            <input
              type="number"
              value={form.rent}
              onChange={(e) => set("rent", e.target.value)}
            />
          </div>
          {!tenant && (
            <div>
              <label>Deposit received (₹)</label>
              <input
                type="number"
                value={form.deposit}
                onChange={(e) => set("deposit", e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="row actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="pri">Save</button>
        </div>
      </form>
    </Modal>
  );
}
function PaymentForm({ tenant, month, payments, settings, onClose, onSave }) {
  const due = Math.max(0, pending(payments, tenant, month));
  const [form, setForm] = useState({
    kind: "rent",
    amount: due || tenant.rent,
    month,
    date: today(),
    note: "",
  });
  const set = (k, v) => setForm({ ...form, [k]: v });
  function kindChange(kind) {
    setForm({
      ...form,
      kind,
      amount:
        kind === "rent"
          ? Math.max(0, pending(payments, tenant, form.month)) || tenant.rent
          : kind === "latefee"
            ? late(payments, settings, tenant) || ""
            : "",
    });
  }
  async function submit(e) {
    e.preventDefault();
    if (!Number(form.amount)) return alert("Enter a valid amount.");
    await onSave({
      ...form,
      amount: Number(form.amount),
      tenantId: tenant._id,
    });
    onClose();
  }
  return (
    <Modal onClose={onClose}>
      <h1>Record payment</h1>
      <div className="mu sm">
        {tenant.name} · Slot {tenant.slot}
        {due ? ` · Pending ${inr(due)}` : ""}
      </div>
      <form onSubmit={submit}>
        <label>Type</label>
        <select value={form.kind} onChange={(e) => kindChange(e.target.value)}>
          <option value="rent">Monthly rent</option>
          <option value="deposit">Deposit received</option>
          <option value="refund">Deposit refunded</option>
          <option value="latefee">Late fee</option>
        </select>
        <div className="two">
          <div>
            <label>Amount (₹)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
            />
          </div>
          <div>
            <label>For month</label>
            <input
              type="month"
              value={form.month}
              onChange={(e) => set("month", e.target.value)}
            />
          </div>
        </div>
        <label>Date paid</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
        />
        <label>Note (optional)</label>
        <input
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="Cash / UPI ref…"
        />
        <div className="row actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="pri">Save</button>
        </div>
      </form>
    </Modal>
  );
}
function App() {
  const [data, setData] = useState({
      tenants: [],
      payments: [],
      settings: { lateFee: 0, grace: 5, theme: "light" },
    }),
    [tab, setTab] = useState("home"),
    [month, setMonth] = useState(currentMonth()),
    [modal, setModal] = useState(null),
    [error, setError] = useState("");
  const reload = () =>
    api
      .load()
      .then(([tenants, payments, settings]) =>
        setData({ tenants, payments, settings }),
      )
      .catch((e) => setError(e.message));
  useEffect(reload, []);
  useEffect(
    () => (document.documentElement.dataset.theme = data.settings.theme),
    [data.settings.theme],
  );
  const { tenants, payments, settings } = data;
  const live = useMemo(
    () =>
      tenants.filter((t) => active(t, month)).sort((a, b) => a.slot - b.slot),
    [tenants, month],
  );
  const saveTenant = async (f) => {
    try {
      const saved = f._id
        ? await api.updateTenant(f._id, f)
        : await api.createTenant(f);
      if (!f._id && f.deposit > 0)
        await api.createPayment({
          tenantId: saved._id,
          kind: "deposit",
          amount: f.deposit,
          month: f.start,
          date: today(),
          note: "Initial deposit",
        });
      reload();
    } catch (e) {
      alert(e.message);
    }
  };
  const savePayment = async (f) => {
    try {
      await api.createPayment(f);
      reload();
    } catch (e) {
      alert(e.message);
    }
  };
  const remind = (t) => {
    const due =
      Math.max(0, pending(payments, t, currentMonth())) +
      late(payments, settings, t);
    const msg = `Hello ${t.name}, your parking payment due is ${inr(due)}. Please pay at your earliest convenience.`;
    navigator.clipboard?.writeText(msg);
    if (t.phone)
      window.open(
        `https://wa.me/${t.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`,
        "_blank",
      );
    else alert("Reminder copied. Add a phone number to open WhatsApp.");
  };
  const receipt = (p) =>
    window
      .open("", "_blank")
      .document.write(
        `<h1>Parking Manager</h1><p>Receipt: ${p.kind}</p><p>Amount: ${inr(p.amount)}</p><p>Date: ${p.date}</p><script>print()<\/script>`,
      );
  const backup = async () => {
    const file = new Blob([JSON.stringify(await api.backup(), null, 2)], {
        type: "application/json",
      }),
      a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = `parking-backup-${today()}.json`;
    a.click();
  };
  const restore = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then(async (text) => {
      try {
        if (confirm("Replace ALL current data with this backup?")) {
          await api.restore(JSON.parse(text));
          setModal(null);
          reload();
        }
      } catch (err) {
        alert(err.message || "Not a valid backup file.");
      }
    });
  };
  const occupied = live.length,
    collected = sum(live.map((t) => ({ amount: paid(payments, t, month) }))),
    expected = sum(live.map((t) => ({ amount: t.rent }))),
    totalDue = sum(
      tenants.map((t) => ({
        amount: Math.max(0, pending(payments, t, month)),
      })),
    ),
    renderRows = live.map((t) => {
      const due = Math.max(0, pending(payments, t, month)),
        isPaid = paid(payments, t, month) >= t.rent;
      return (
        <div
          className="item"
          key={t._id}
          onClick={() => setModal({ type: "detail", tenant: t })}
        >
          <div className="slot">{t.slot}</div>
          <div className="m">
            <b>{t.name}</b>
            <div className="mu sm">
              {t.car || ""} · Paid {inr(paid(payments, t, month))} /{" "}
              {inr(t.rent)}
              {due ? ` · Due ${inr(due)}` : ""}
            </div>
          </div>
          <span
            className={
              "chip " +
              (isPaid ? "paid" : paid(payments, t, month) > 0 ? "part" : "unp")
            }
          >
            {isPaid
              ? "Paid"
              : paid(payments, t, month) > 0
                ? "Partial"
                : "Unpaid"}
          </span>
          {due || late(payments, settings, t) ? (
            <button
              className="sq"
              onClick={(e) => {
                e.stopPropagation();
                remind(t);
              }}
            >
              🔔
            </button>
          ) : null}
          <button
            className="sq"
            onClick={(e) => {
              e.stopPropagation();
              setModal({ type: "pay", tenant: t });
            }}
          >
            ＋
          </button>
        </div>
      );
    });
  return (
    <>
      <main>
        {error && <div className="note">{error}</div>}
        {tab === "home" && (
          <>
            <div className="row">
              <h1>Parking Manager</h1>
              <button
                className="sq"
                onClick={() => setModal({ type: "settings" })}
              >
                ⚙
              </button>
            </div>
            <div className="mon">
              <button
                className="sq"
                onClick={() => setMonth(shiftMonth(month, -1))}
              >
                ‹
              </button>
              <b>{monthLabel(month)}</b>
              <button
                className="sq"
                onClick={() => setMonth(shiftMonth(month, 1))}
              >
                ›
              </button>
            </div>
            <div className="grid">
              {[
                ["Collected", inr(collected), "ok"],
                ["Total pending", inr(totalDue), "er"],
                [
                  "Deposits held",
                  inr(
                    sum(tenants.map((t) => ({ amount: deposit(payments, t) }))),
                  ),
                  "",
                ],
                ["Slots occupied", `${occupied} / ${CAPACITY}`, ""],
                [
                  "Late fees due",
                  inr(
                    sum(
                      tenants.map((t) => ({
                        amount: late(payments, settings, t),
                      })),
                    ),
                  ),
                  "wa",
                ],
                [
                  "Late fee rule",
                  settings.lateFee
                    ? `${inr(settings.lateFee)} after day ${settings.grace}`
                    : "Off · set in ⚙",
                  "",
                ],
              ].map(([label, value, color]) => (
                <div className="card" key={label}>
                  <div className="mu sm">{label}</div>
                  <div className={"big " + color}>{value}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="row sm">
                <span className="mu">This month's rent</span>
                <span>
                  {inr(collected)} of {inr(expected)}
                </span>
              </div>
              <div className="bar">
                <i
                  style={{
                    width: `${expected ? Math.min(100, (collected / expected) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="card">
              {renderRows.length ? (
                renderRows
              ) : (
                <div className="empty">
                  No tenants yet.
                  <br />
                  Open the Tenants tab to add one.
                </div>
              )}
            </div>
          </>
        )}
        {tab === "tenants" && (
          <>
            <h1>
              Tenants{" "}
              <span className="mu sm">
                {occupied}/{CAPACITY}
              </span>
            </h1>
            <div className="card">
              {renderRows.length ? (
                renderRows
              ) : (
                <div className="empty">No tenants yet. Tap “Add tenant”.</div>
              )}
            </div>
            <button
              className="pri fab"
              onClick={() => setModal({ type: "tenant" })}
            >
              + Add tenant
            </button>
          </>
        )}
        {tab === "year" && (
          <Year
            tenants={tenants}
            payments={payments}
            year={month.slice(0, 4)}
            onYear={(y) => setMonth(`${y}-${month.slice(5)}`)}
          />
        )}
      </main>
      <nav>
        {[
          ["home", "Monthly"],
          ["tenants", "Tenants"],
          ["year", "Year"],
        ].map(([id, label]) => (
          <button
            className={tab === id ? "on" : ""}
            onClick={() => setTab(id)}
            key={id}
          >
            {label}
          </button>
        ))}
      </nav>
      {modal?.type === "tenant" && (
        <TenantForm
          tenants={tenants}
          month={month}
          onClose={() => setModal(null)}
          onSave={saveTenant}
        />
      )}{" "}
      {modal?.type === "pay" && (
        <PaymentForm
          {...modal}
          payments={payments}
          settings={settings}
          month={month}
          onClose={() => setModal(null)}
          onSave={savePayment}
        />
      )}{" "}
      {modal?.type === "detail" && (
        <Detail
          tenant={modal.tenant}
          payments={payments}
          settings={settings}
          onClose={() => setModal(null)}
          onPay={() => setModal({ type: "pay", tenant: modal.tenant })}
          onEdit={() => setModal({ type: "edit", tenant: modal.tenant })}
          remind={remind}
          receipt={receipt}
          reload={reload}
        />
      )}{" "}
      {modal?.type === "edit" && (
        <TenantForm
          tenant={modal.tenant}
          tenants={tenants}
          month={month}
          onClose={() => setModal(null)}
          onSave={saveTenant}
        />
      )}{" "}
      {modal?.type === "settings" && (
        <Settings
          settings={settings}
          onClose={() => setModal(null)}
          backup={backup}
          restore={restore}
          save={async (s) => {
            await api.saveSettings(s);
            reload();
            setModal(null);
          }}
        />
      )}
    </>
  );
}
function Detail({
  tenant,
  payments,
  settings,
  onClose,
  onPay,
  onEdit,
  remind,
  receipt,
  reload,
}) {
  const entries = payments
    .filter((p) => p.tenantId === tenant._id)
    .sort((a, b) => b.date.localeCompare(a.date));
  async function vacate() {
    const end = prompt("Last rented month (YYYY-MM):", currentMonth());
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(end)) {
      await api.updateTenant(tenant._id, { ...tenant, end });
      reload();
      onClose();
    }
  }
  return (
    <Modal onClose={onClose}>
      <div className="row">
        <h1>{tenant.name}</h1>
        <span className="slot">{tenant.slot}</span>
      </div>
      <div className="mu sm">
        {tenant.car || "—"} · {tenant.phone || "no phone"} · since{" "}
        {monthLabel(tenant.start)}
      </div>
      <div className="grid">
        <div className="card">
          <div className="mu sm">Rent / month</div>
          <div className="big">{inr(tenant.rent)}</div>
        </div>
        <div className="card">
          <div className="mu sm">Deposit held</div>
          <div className="big">{inr(deposit(payments, tenant))}</div>
        </div>
      </div>
      <div className="row actions">
        <button className="pri" onClick={onPay}>
          Add payment
        </button>
        <button onClick={() => remind(tenant)}>🔔</button>
        <button onClick={onEdit}>Edit</button>
      </div>
      <div className="card">
        {entries.map((p) => (
          <div className="item" key={p._id}>
            <div className="m">
              <b>{p.kind}</b>
              <div className="mu sm">
                {p.date} {p.note}
              </div>
            </div>
            <b>{inr(p.amount)}</b>
            <button className="sq" onClick={() => receipt(p)}>
              🧾
            </button>
            <button
              className="sq dng"
              onClick={async () => {
                if (confirm("Delete this entry?")) {
                  await api.deletePayment(p._id);
                  reload();
                }
              }}
            >
              ✕
            </button>
          </div>
        )) || <div className="empty">No payments yet.</div>}
      </div>
      <div className="row actions">
        <button className="dng" onClick={vacate}>
          Vacate slot
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
function Settings({ settings, onClose, save, backup, restore }) {
  const [s, setS] = useState(settings);
  return (
    <Modal onClose={onClose}>
      <h1>Late fee settings</h1>
      <div className="mu sm">
        A late fee is added for every month whose rent isn't fully paid by the
        due day. Set 0 to turn off.
      </div>
      <div className="two">
        <div>
          <label>Late fee per month (₹)</label>
          <input
            type="number"
            value={s.lateFee}
            onChange={(e) => setS({ ...s, lateFee: Number(e.target.value) })}
          />
        </div>
        <div>
          <label>Due day of month</label>
          <input
            type="number"
            min="1"
            max="28"
            value={s.grace}
            onChange={(e) =>
              setS({
                ...s,
                grace: Math.min(28, Math.max(1, Number(e.target.value))),
              })
            }
          />
        </div>
      </div>
      <label>Theme</label>
      <select
        value={s.theme}
        onChange={(e) => setS({ ...s, theme: e.target.value })}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <div className="row actions">
        <button onClick={onClose}>Cancel</button>
        <button className="pri" onClick={() => save(s)}>
          Save
        </button>
      </div>
      <div className="two">
        <button onClick={backup}>Download backup</button>
        <label className="file">
          Restore backup
          <input type="file" accept=".json" onChange={restore} />
        </label>
      </div>
    </Modal>
  );
}
function Year({ tenants, payments, year, onYear }) {
  const months = Array.from(
    { length: 12 },
    (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`,
  );
  return (
    <>
      <div className="row">
        <h1>Year summary</h1>
        <select value={year} onChange={(e) => onYear(e.target.value)}>
          {Array.from(
            { length: 11 },
            (_, i) => Number(currentMonth().slice(0, 4)) - 5 + i,
          ).map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>
      <div className="card">
        {months.map((m) => {
          const activeTenants = tenants.filter((t) => active(t, m));
          const collected = sum(
            activeTenants.map((t) => ({ amount: paid(payments, t, m) })),
          );
          const due = sum(activeTenants.map((t) => ({ amount: t.rent })));
          return (
            <div className="item" key={m}>
              <div className="m">
                <b>{monthLabel(m)}</b>
                <div className="mu sm">
                  {activeTenants.length} occupied · {inr(collected)} of{" "}
                  {inr(due)}
                </div>
              </div>
              <span className={"chip " + (collected >= due ? "paid" : "unp")}>
                {due ? `${Math.round((collected / due) * 100)}%` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
export default App;
