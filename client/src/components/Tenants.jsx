import React from "react";

import { CAPACITY, currentMonth, inr, pending, late, deposit } from "../utils";

// WhatsApp SVG icon
const WA_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-label="WhatsApp">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

function Tenants({
  tenants,
  payments,
  settings,
  live,
  month,
  occupied,
  setModal,
}) {
  // --------------------------------------------------
  // WhatsApp reminder
  // Same logic as old quickWA()
  // --------------------------------------------------
  const remindTenant = (tenant) => {
    const phoneNumber = (tenant.phone || "").replace(/\D/g, "");

    if (!phoneNumber) {
      alert(
        `No phone number saved for ${tenant.name}. Open the tenant and tap Edit to add one.`,
      );
      return;
    }

    // OLD LOGIC:
    // const cur = ym(new Date())
    const current = currentMonth();

    // OLD LOGIC:
    // const p = Math.max(0, pending(t, cur))
    const pendingRent = Math.max(0, pending(payments, tenant, current));

    // OLD LOGIC:
    // const l = lateDue(t)
    const lateFee = late(payments, settings, tenant);

    // OLD MESSAGE LOGIC
    const message =
      pendingRent + lateFee > 0
        ? `Hello ${tenant.name}, gentle reminder: parking rent for slot ${tenant.slot}${
            tenant.car ? ` (${tenant.car})` : ""
          } is pending. Rent due: ${inr(pendingRent)}` +
          (lateFee ? `, late fee: ${inr(lateFee)}` : "") +
          `. Total: ${inr(
            pendingRent + lateFee,
          )}. Please pay at the earliest. Thank you!`
        : `Hello ${tenant.name}, `;

    window.open(
      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  // --------------------------------------------------
  // Tenant rows
  // Same layout/logic as old list()
  // --------------------------------------------------
  const renderRows = live.map((tenant) => {
    // OLD:
    // const p =
    //   Math.max(0, pending(t, ym(new Date()))) +
    //   lateDue(t);

    const pendingRent = Math.max(0, pending(payments, tenant, currentMonth()));

    const lateFee = late(payments, settings, tenant);

    const totalDue = pendingRent + lateFee;

    return (
      <div
        className="item"
        key={tenant._id}
        onClick={() =>
          setModal({
            type: "detail",
            tenant,
          })
        }
      >
        {/* Slot */}
        <div className="slot">{tenant.slot}</div>

        {/* Tenant information */}
        <div className="m">
          <div>
            <b>{tenant.name}</b>
          </div>

          <div className="mu sm">
            {tenant.car || ""} · {inr(tenant.rent)}/mo · Deposit{" "}
            {inr(deposit(payments, tenant))}
          </div>

          {/* OLD:
              ${p ? `<span class="chip unp">${inr(p)} due</span>`
                  : '<span class="chip paid">Clear</span>'}
          */}
          <div
            style={{
              marginTop: "3px",
            }}
          >
            {totalDue ? (
              <span className="chip unp">{inr(totalDue)} due</span>
            ) : (
              <span className="chip paid">Clear</span>
            )}
          </div>
        </div>

        {/* WhatsApp */}
        <button
          className="sq wa"
          title="WhatsApp"
          onClick={(e) => {
            e.stopPropagation();
            remindTenant(tenant);
          }}
        >
          {WA_ICON}
        </button>
      </div>
    );
  });

  return (
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
        onClick={() =>
          setModal({
            type: "tenant",
          })
        }
      >
        + Add tenant
      </button>
    </>
  );
}

export default Tenants;
