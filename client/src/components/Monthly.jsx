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
  slips,
  expenses,
  setMonth,
  setModal,
  openReminder,
}) {
  // Daily collection calculation
  const monthlySlips = (slips || []).filter(
    (slip) => slip.date?.slice(0, 7) === month,
  );

  const dailySummary = monthlySlips.reduce(
    (result, slip) => {
      const count =
        slip.start != null && slip.end != null && slip.end >= slip.start
          ? slip.end - slip.start + 1
          : 0;

      const amount = count * Number(slip.rate || 0);
      const overtime = Number(slip.over || 0);
      const cash = Number(slip.cash || 0);
      const paytm = Number(slip.paytm || 0);

      const expectedAmount = amount + overtime;
      const noPayment = !cash && !paytm;
      const total = noPayment ? expectedAmount : cash + paytm;

      result.n += count;
      result.cash += noPayment ? expectedAmount : cash;
      result.pt += paytm;
      result.ot += overtime;
      result.short += noPayment ? 0 : Math.max(0, expectedAmount - total);
      result.total += total;

      return result;
    },
    {
      n: 0,
      cash: 0,
      pt: 0,
      ot: 0,
      short: 0,
      total: 0,
    },
  );

  // Monthly expenses
  const monthlyExpenses = (expenses || []).filter(
    (expense) => expense.date?.slice(0, 7) === month,
  );

  const totalExpenses = monthlyExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0,
  );

  // Revenue and net
  // Rent + late fees received during the selected month
  const monthlyRentIncome = payments
    .filter(
      (payment) =>
        payment.kind === "rent" && payment.date?.slice(0, 7) === month,
    )
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);

  const monthlyLateIncome = payments
    .filter(
      (payment) =>
        payment.kind === "late" && payment.date?.slice(0, 7) === month,
    )
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);

  // Daily collection
  const dailyIncome = dailySummary.total;

  // Total income
  const totalRevenue = monthlyRentIncome + monthlyLateIncome + dailyIncome;

  // Net amount
  const netAmount = totalRevenue - totalExpenses;

  const renderRows = live.map((tenant) => {
    const due = Math.max(0, pending(payments, tenant, month));

    const paidAmount = paid(payments, tenant, month);

    const isPaid = paidAmount >= tenant.rent;

    return (
      <div
        className="item"
        key={tenant._id}
        // onClick={() =>
        //   setModal({
        //     type: "detail",
        //     tenant,
        //   })
        // }
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
              openReminder(tenant);
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
      {/* REVENUE & EXPENSES */}
      <div className="card">
        <b>Revenue & Expenses · {monthLabel(month)}</b>

        <div className="item">
          <div className="m">Rent collected</div>
          <b>{inr(monthlyRentIncome)}</b>
        </div>

        <div className="item">
          <div className="m">Late fees received</div>
          <b>{inr(monthlyLateIncome)}</b>
        </div>

        <div className="item">
          <div className="m">In-slips used</div>
          <b>{dailySummary.n}</b>
        </div>

        <div className="item">
          <div className="m">Cash</div>
          <b>{inr(dailySummary.cash)}</b>
        </div>

        <div className="item">
          <div className="m">PayTM</div>
          <b>{inr(dailySummary.pt)}</b>
        </div>

        <div className="item">
          <div className="m">Overtime (included)</div>
          <b>{inr(dailySummary.ot)}</b>
        </div>

        <div className="item">
          <div className="m">Short amount</div>
          <b style={{ color: "var(--er)" }}>{inr(dailySummary.short)}</b>
        </div>

        <div className="item">
          <div className="m">Daily collection total</div>
          <b>{inr(dailyIncome)}</b>
        </div>

        <div className="item tot">
          <div className="m">
            Total income
            <div className="mu sm" style={{ fontWeight: 400 }}>
              Rent {inr(monthlyRentIncome)} + Late fees {inr(monthlyLateIncome)}{" "}
              + Daily {inr(dailyIncome)}
            </div>
          </div>

          <span style={{ color: "var(--ok)", fontSize: 18 }}>
            {inr(totalRevenue)}
          </span>
        </div>

        <div className="item">
          <div className="m">Total expenses</div>
          <b style={{ color: "var(--er)" }}>− {inr(totalExpenses)}</b>
        </div>

        <div className="item tot">
          <div className="m">Net (income − expenses)</div>

          <span
            style={{
              color: netAmount < 0 ? "var(--er)" : "var(--ok)",
              fontSize: 18,
            }}
          >
            {inr(netAmount)}
          </span>
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