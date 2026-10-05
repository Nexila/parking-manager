import React, { useState } from "react";

import { api } from "../api";

import {
  CAPACITY,
  currentMonth,
  today,
  monthLabel,
  inr,
  pending,
  deposit,
  late,
} from "../utils";

// ==================================================
// MODAL WRAPPER
// ==================================================

export function Modal({ children, onClose }) {
  return (
    <div
      className="ov"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="sheet">{children}</div>
    </div>
  );
}

// ==================================================
// TENANT FORM
// ==================================================

const blankTenant = (month) => ({
  name: "",
  phone: "",
  car: "",
  slot: "",
  start: month,
  rent: "",
  deposit: 0,
});

export function TenantForm({ tenant, tenants, month, onClose, onSave }) {
  const [form, setForm] = useState(tenant || blankTenant(month));

  const set = (key, value) => {
    setForm({
      ...form,
      [key]: value,
    });
  };

  const used = new Set(
    tenants.filter((t) => t._id !== tenant?._id && !t.end).map((t) => t.slot),
  );

  async function submit(e) {
    e.preventDefault();

    if (!form.name.trim() || !Number(form.rent)) {
      return alert("Enter a name and monthly rent.");
    }

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

              {Array.from(
                {
                  length: CAPACITY,
                },
                (_, i) => i + 1,
              )
                .filter((n) => !used.has(n) || n === tenant?.slot)
                .map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
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

// ==================================================
// PAYMENT FORM
// ==================================================

export function PaymentForm({
  tenant,
  month,
  payments,
  settings,
  onClose,
  onSave,
}) {
  const due = Math.max(0, pending(payments, tenant, month));

  const [form, setForm] = useState({
    kind: "rent",
    amount: due || tenant.rent,
    month,
    date: today(),
    note: "",
  });

  const set = (key, value) => {
    setForm({
      ...form,
      [key]: value,
    });
  };

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

    if (!Number(form.amount)) {
      return alert("Enter a valid amount.");
    }

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

// ==================================================
// DETAIL
// ==================================================
export function Detail({
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
  // --------------------------------------------------
  // Current month
  // --------------------------------------------------

  const cur = currentMonth();

  // --------------------------------------------------
  // Pending amount
  // --------------------------------------------------

  const pendingAmount = Math.max(0, pending(payments, tenant, cur));

  // --------------------------------------------------
  // Late fee due
  // --------------------------------------------------

  const lateDue = late(payments, settings, tenant);

  // --------------------------------------------------
  // Tenant payment history
  // --------------------------------------------------

  const entries = payments
    .filter((payment) => payment.tenantId === tenant._id)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  // --------------------------------------------------
  // Payment label
  // --------------------------------------------------

  const paymentLabel = (kind) => {
    const labels = {
      rent: "Rent",
      deposit: "Deposit in",
      refund: "Deposit out",
      latefee: "Late fee",
    };

    return labels[kind] || kind;
  };

  // --------------------------------------------------
  // Vacate
  // --------------------------------------------------

  async function vacate() {
    const end = prompt("Last rented month (YYYY-MM):", cur);

    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(end)) {
      try {
        await api.updateTenant(tenant._id, {
          ...tenant,
          end,
        });

        await reload();
        onClose();
      } catch (error) {
        alert(error.message || "Failed to vacate tenant.");
      }
    }
  }

  // --------------------------------------------------
  // Call tenant
  // --------------------------------------------------

  const callTenant = () => {
    if (!tenant.phone) {
      alert("No phone number available.");
      return;
    }

    window.location.href = `tel:${tenant.phone}`;
  };

  // --------------------------------------------------
  // WhatsApp
  // --------------------------------------------------

  const quickWhatsApp = () => {
    if (!tenant.phone) {
      alert("No phone number available for WhatsApp.");
      return;
    }

    const due = pendingAmount + lateDue;

    const message =
      `Hello ${tenant.name}, ` +
      `your parking payment due is ${inr(due)}. ` +
      `Please pay at your earliest convenience.`;

    const phone = tenant.phone.replace(/\D/g, "");

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  return (
    <Modal onClose={onClose}>
      {/* ------------------------------------------------
          Tenant heading
      ------------------------------------------------ */}

      <div className="row">
        <h1 style={{ margin: 0 }}>{tenant.name}</h1>

        <span className="slot">{tenant.slot}</span>
      </div>

      {/* ------------------------------------------------
          Tenant information
      ------------------------------------------------ */}

      <div
        className="mu sm"
        style={{
          margin: "4px 0 10px",
        }}
      >
        {tenant.car || "—"} · {tenant.phone || "no phone"} · since{" "}
        {monthLabel(tenant.start)}
      </div>

      {/* ------------------------------------------------
          Summary cards
      ------------------------------------------------ */}

      <div className="grid">
        {/* Rent */}
        <div className="card">
          <div className="mu sm">Rent / month</div>

          <div className="big">{inr(tenant.rent)}</div>
        </div>

        {/* Pending */}
        <div className="card">
          <div className="mu sm">Pending till {monthLabel(cur)}</div>

          <div
            className="big"
            style={{
              color: pendingAmount ? "var(--er)" : "var(--ok)",
            }}
          >
            {inr(pendingAmount)}
          </div>
        </div>

        {/* Deposit */}
        <div className="card">
          <div className="mu sm">Deposit held</div>

          <div className="big">{inr(deposit(payments, tenant))}</div>
        </div>

        {/* Call */}
        {tenant.phone ? (
          <button
            type="button"
            className="card"
            style={{
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
              textAlign: "left",
            }}
            onClick={callTenant}
          >
            <div className="mu sm">Call</div>

            <div className="big">📞</div>
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* ------------------------------------------------
          Late fee notification
      ------------------------------------------------ */}

      {lateDue > 0 && <div className="note">Late fees due: {inr(lateDue)}</div>}

      {/* ------------------------------------------------
          Action buttons
      ------------------------------------------------ */}

      <div
        className="row"
        style={{
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <button
          className="pri"
          style={{
            flex: 1,
          }}
          onClick={onPay}
        >
          Add payment
        </button>

        <button onClick={() => remind(tenant)} title="Reminder">
          🔔
        </button>

        <button className="sq wa" title="WhatsApp" onClick={quickWhatsApp}>
          💬
        </button>

        <button onClick={onEdit}>Edit</button>
      </div>

      {/* ------------------------------------------------
          Payment history
      ------------------------------------------------ */}

      <div
        className="card"
        style={{
          marginBottom: "10px",
        }}
      >
        {entries.length ? (
          entries.map((payment) => {
            const isRefund = payment.kind === "refund";

            return (
              <div className="item" key={payment._id}>
                {/* Payment information */}
                <div className="m">
                  <div>
                    <b>{paymentLabel(payment.kind)}</b>

                    {payment.kind === "rent" && payment.month && (
                      <>
                        {" · "}
                        {monthLabel(payment.month)}
                      </>
                    )}
                  </div>

                  <div className="mu sm">
                    {payment.date || ""} {payment.note || ""}
                  </div>
                </div>

                {/* Amount */}
                <b
                  style={{
                    color: isRefund ? "var(--er)" : "var(--ok)",
                  }}
                >
                  {isRefund ? "−" : "+"}
                  {inr(payment.amount)}
                </b>

                {/* Receipt */}
                <button className="sq" onClick={() => receipt(payment)}>
                  🧾
                </button>

                {/* Delete */}
                <button
                  className="sq dng"
                  onClick={async () => {
                    if (confirm("Delete this entry?")) {
                      try {
                        await api.deletePayment(payment._id);

                        await reload();
                      } catch (error) {
                        alert(error.message || "Failed to delete payment.");
                      }
                    }
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })
        ) : (
          <div className="empty">No payments yet.</div>
        )}
      </div>

      {/* ------------------------------------------------
          Bottom actions
      ------------------------------------------------ */}

      <div className="row">
        <button className="dng" onClick={vacate}>
          Vacate slot
        </button>

        <button onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
// ==================================================
// SETTINGS
// ==================================================

export function Settings({ settings, onClose, save, backup, restore }) {
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
            onChange={(e) =>
              setS({
                ...s,
                lateFee: Number(e.target.value),
              })
            }
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
        onChange={(e) =>
          setS({
            ...s,
            theme: e.target.value,
          })
        }
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
