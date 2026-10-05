import React from "react";

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
  deposit, // ADD THIS
  late,
  sum,
} from "../utils";

function Monthly({
  tenants,
  payments,
  settings,
  live,
  month,
  occupied,
  collected,
  expected,
  totalDue,
  setMonth,
  setModal,
  remind,
}) {
  const renderRows = live.map((tenant) => {
    const due = Math.max(0, pending(payments, tenant, month));

    const paidAmount = paid(payments, tenant, month);

    const isPaid = paidAmount >= tenant.rent;

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
        <div className="slot">{tenant.slot}</div>

        <div className="m">
          <b>{tenant.name}</b>
          <div className="mu sm">
            {tenant.car || ""} · Paid {inr(paidAmount)} / {inr(tenant.rent)}
            {due > 0 && (
              <>
                {" · "}
                <span className="chip unp">Due {inr(due)}</span>
              </>
            )}
          </div>
        </div>

        <span
          className={
            "chip " + (isPaid ? "paid" : paidAmount > 0 ? "part" : "unp")
          }
        >
          {isPaid ? "Paid" : paidAmount > 0 ? "Partial" : "Unpaid"}
        </span>

        {due || late(payments, settings, tenant) ? (
          <button
            className="sq"
            onClick={(e) => {
              e.stopPropagation();
              remind(tenant);
            }}
          >
            🔔
          </button>
        ) : null}

        <button
          className="sq"
          onClick={(e) => {
            e.stopPropagation();

            setModal({
              type: "pay",
              tenant,
            });
          }}
        >
          +
        </button>
      </div>
    );
  });

  return (
    <>
      <div className="row">
        <h1>Parking Manager</h1>

        <button
          className="sq"
          onClick={() =>
            setModal({
              type: "settings",
            })
          }
        >
          ⚙
        </button>
      </div>

      {/* MONTH NAVIGATION */}
      <div className="mon">
        <button className="sq" onClick={() => setMonth(shiftMonth(month, -1))}>
          ‹
        </button>

        <b>{monthLabel(month)}</b>

        <button className="sq" onClick={() => setMonth(shiftMonth(month, 1))}>
          ›
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid">
        {[
          ["Collected", inr(collected), "ok"],

          ["Total pending", inr(totalDue), "er"],

          [
            "Deposits held",
            inr(
              sum(
                tenants.map((tenant) => ({
                  amount: deposit(payments, tenant),
                })),
              ),
            ),
            "",
          ],

          ["Slots occupied", `${occupied} / ${CAPACITY}`, ""],

          [
            "Late fees due",
            inr(
              sum(
                tenants.map((tenant) => ({
                  amount: late(payments, settings, tenant),
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

      {/* RENT PROGRESS */}
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
              width: `${
                expected ? Math.min(100, (collected / expected) * 100) : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* TENANTS */}
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
  );
}

export default Monthly;
