import React from "react";

function Year({ tenants, payments, year, onYear, slips = [], expenses = [] }) {
  const getMonthKey = (monthIndex) => {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  };

  const getMonthLabel = (monthKey) => {
    const [yearValue, monthValue] = monthKey.split("-");

    return new Date(
      Number(yearValue),
      Number(monthValue) - 1,
      1,
    ).toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return "₹" + Math.round(Number(amount || 0)).toLocaleString("en-IN");
  };

  const getMonthIndex = (monthKey) => {
    const [yearValue, monthValue] = monthKey.split("-").map(Number);

    return yearValue * 12 + monthValue - 1;
  };

  const isTenantActive = (tenant, monthKey) => {
    return (
      getMonthIndex(monthKey) >= getMonthIndex(tenant.start) &&
      (!tenant.end || getMonthIndex(monthKey) <= getMonthIndex(tenant.end))
    );
  };

  const getPaymentTotal = (paymentList) => {
    return paymentList.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0,
    );
  };

  const getTenantYearRentPayments = (tenant) => {
    return payments
      .filter(
        (payment) =>
          payment.tenantId === tenant._id || payment.tenantId === tenant.id,
      )
      .filter(
        (payment) =>
          payment.kind === "rent" && payment.month?.startsWith(String(year)),
      );
  };

  const getYearPaymentTotal = (paymentType) => {
    return getPaymentTotal(
      payments.filter(
        (payment) =>
          payment.kind === paymentType &&
          (payment.date || "").startsWith(String(year)),
      ),
    );
  };

  // ----------------------------------------
  // DAILY COLLECTION CALCULATION
  // ----------------------------------------

  const yearlySlips = slips.filter(
    (slip) => (slip.date || "").slice(0, 4) === String(year),
  );

  const dailySummary = yearlySlips.reduce(
    (result, slip) => {
      const count =
        slip.start != null && slip.end != null && slip.end >= slip.start
          ? slip.end - slip.start + 1
          : 0;

      const amount = count * Number(slip.rate || 0);
      const overtime = Number(slip.over || 0);
      const expected = amount + overtime;

      const cash = Number(slip.cash || 0);
      const paytm = Number(slip.paytm || 0);

      const noPayment = !cash && !paytm;
      const total = noPayment ? expected : cash + paytm;

      result.n += count;
      result.cash += noPayment ? expected : cash;
      result.pt += paytm;
      result.ot += overtime;
      result.short += noPayment ? 0 : Math.max(0, expected - total);
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

  // ----------------------------------------
  // MONTHLY CALCULATIONS
  // ----------------------------------------

  let totalExpectedRent = 0;
  let totalCollectedRent = 0;

  const monthlyRows = Array.from({ length: 12 }, (_, index) => {
    const monthKey = getMonthKey(index);

    const activeTenants = tenants.filter((tenant) =>
      isTenantActive(tenant, monthKey),
    );

    const expectedRent = activeTenants.reduce(
      (total, tenant) => total + Number(tenant.rent || 0),
      0,
    );

    const collectedRent = getPaymentTotal(
      payments.filter(
        (payment) => payment.kind === "rent" && payment.month === monthKey,
      ),
    );

    totalExpectedRent += expectedRent;
    totalCollectedRent += collectedRent;

    const percentage = expectedRent
      ? Math.min(100, (collectedRent / expectedRent) * 100)
      : 0;

    return {
      monthKey,
      shortMonthLabel: getMonthLabel(monthKey).slice(0, 3),
      expectedRent,
      collectedRent,
      percentage,
    };
  });

  // Daily + rent + expenses month-wise
  const monthRevenueRows = monthlyRows.map((month) => {
    const monthDailySlips = yearlySlips.filter(
      (slip) => (slip.date || "").slice(0, 7) === month.monthKey,
    );

    const daily = monthDailySlips.reduce((total, slip) => {
      const count =
        slip.start != null && slip.end != null && slip.end >= slip.start
          ? slip.end - slip.start + 1
          : 0;

      const expected = count * Number(slip.rate || 0) + Number(slip.over || 0);

      const cash = Number(slip.cash || 0);
      const paytm = Number(slip.paytm || 0);

      return total + (!cash && !paytm ? expected : cash + paytm);
    }, 0);

    const expense = expenses
      .filter((item) => (item.date || "").slice(0, 7) === month.monthKey)
      .reduce((total, item) => total + Number(item.amount || 0), 0);

    return {
      ...month,
      daily,
      expense,
      net: month.collectedRent + daily - expense,
    };
  });

  const totalExpenses = monthRevenueRows.reduce(
    (total, month) => total + month.expense,
    0,
  );

  const totalRevenue = totalCollectedRent + dailySummary.total;

  const net = totalRevenue - totalExpenses;

  const lateFeesCollected = getYearPaymentTotal("latefee");
  const depositsReceived = getYearPaymentTotal("deposit");
  const depositsRefunded = getYearPaymentTotal("refund");

  const rentShort = Math.max(0, totalExpectedRent - totalCollectedRent);

  // ----------------------------------------
  // TENANT SUMMARY
  // ----------------------------------------

  const tenantYearRows = tenants
    .map((tenant) => {
      let activeMonths = 0;

      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthKey = getMonthKey(monthIndex);

        if (isTenantActive(tenant, monthKey)) {
          activeMonths++;
        }
      }

      if (activeMonths === 0) return null;

      const paidRent = getPaymentTotal(getTenantYearRentPayments(tenant));

      const expectedRent = Number(tenant.rent || 0) * activeMonths;
      const balance = expectedRent - paidRent;

      return {
        tenant,
        paidRent,
        balance,
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(a.tenant.slot) - Number(b.tenant.slot));

  // ----------------------------------------
  // UI
  // -------------------------------

  return (
    <div className="year-page">
      <h1>Yearly summary</h1>
      <div className="mon">
        <button className="sq" onClick={() => onYear(year - 1)}>
          ‹
        </button>

        <b>{year}</b>

        <button className="sq" onClick={() => onYear(year + 1)}>
          ›
        </button>
      </div>

      {/* TOP SUMMARY */}
      <div className="grid">
        <div className="card">
          <div className="mu sm">Rent collected</div>
          <div className="big" style={{ color: "var(--ok)" }}>
            {formatCurrency(totalCollectedRent)}
          </div>
        </div>

        <div className="card">
          <div className="mu sm">Rent short</div>
          <div className="big" style={{ color: "var(--er)" }}>
            {formatCurrency(rentShort)}
          </div>
        </div>

        <div className="card">
          <div className="mu sm">Late fees collected</div>
          <div className="big">{formatCurrency(lateFeesCollected)}</div>
        </div>

        <div className="card">
          <div className="mu sm">Deposits in / out</div>
          <div className="big" style={{ fontSize: "16px" }}>
            {formatCurrency(depositsReceived)} /{" "}
            {formatCurrency(depositsRefunded)}
          </div>
        </div>
      </div>
      {/* YEAR SUMMARY */}
      <div className="grid">
        <div className="card">
          <div className="mu sm">Daily collection</div>
          <div className="big">{formatCurrency(dailySummary.total)}</div>
          <div className="mu sm">{dailySummary.n} slips</div>
        </div>

        <div className="card">
          <div className="mu sm">Total revenue</div>
          <div className="big" style={{ color: "var(--ok)" }}>
            {formatCurrency(totalRevenue)}
          </div>
          <div className="mu sm">Rent + daily</div>
        </div>

        <div className="card">
          <div className="mu sm">Total expenses</div>
          <div className="big" style={{ color: "var(--er)" }}>
            {formatCurrency(totalExpenses)}
          </div>
        </div>

        <div className="card">
          <div className="mu sm">Net</div>
          <div
            className="big"
            style={{ color: net < 0 ? "var(--er)" : "var(--ok)" }}
          >
            {formatCurrency(net)}
          </div>
        </div>
      </div>

      {/* DAILY COLLECTION SPLIT */}
      <div className="card">
        <div className="mu sm">Daily collection split</div>

        <div className="item">
          <div className="m">Cash</div>
          <b>{formatCurrency(dailySummary.cash)}</b>
        </div>

        <div className="item">
          <div className="m">PayTM</div>
          <b>{formatCurrency(dailySummary.pt)}</b>
        </div>

        <div className="item">
          <div className="m">Overtime (included)</div>
          <b>{formatCurrency(dailySummary.ot)}</b>
        </div>

        <div className="item">
          <div className="m">Short amount</div>
          <b style={{ color: "var(--er)" }}>
            {formatCurrency(dailySummary.short)}
          </b>
        </div>
      </div>

      {/* MONTH-WISE REVENUE & EXPENSES */}
      <div className="card" style={{ overflowX: "auto" }}>
        <div className="mu sm">Month-wise revenue &amp; expenses</div>

        {/* MONTH-WISE REVENUE & EXPENSES */}
        <div className="card" style={{ overflowX: "auto" }}>
          <div className="mu sm">Month-wise revenue &amp; expenses</div>

          <div
            style={{
              minWidth: "520px",
              marginTop: "12px",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "55px repeat(4, minmax(0, 1fr))",
                gap: "8px",
                padding: "10px 8px",
                borderBottom: "1px solid #c4c4c4",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--mu)",
              }}
            >
              <span>Month</span>
              <span style={{ textAlign: "right" }}>Rent</span>
              <span style={{ textAlign: "right" }}>Daily</span>
              <span style={{ textAlign: "right" }}>Expenses</span>
              <span style={{ textAlign: "right" }}>Net</span>
            </div>

            {/* MONTH ROWS */}
            {monthRevenueRows.map((month) => (
              <div
                key={month.monthKey}
                style={{
                  display: "grid",
                  gridTemplateColumns: "55px repeat(4, minmax(0, 1fr))",
                  gap: "8px",
                  alignItems: "center",
                  padding: "12px 8px",
                  borderBottom: "1px solid #c4c4c4",
                  fontSize: "13px",
                }}
              >
                <span className="mu sm">{month.shortMonthLabel}</span>

                <span style={{ textAlign: "right" }}>
                  {formatCurrency(month.collectedRent)}
                </span>

                <span style={{ textAlign: "right" }}>
                  {formatCurrency(month.daily)}
                </span>

                <span style={{ textAlign: "right" }}>
                  {formatCurrency(month.expense)}
                </span>

                <b
                  style={{
                    textAlign: "right",
                    color: month.net < 0 ? "var(--er)" : "var(--ok)",
                  }}
                >
                  {formatCurrency(month.net)}
                </b>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COLLECTED / EXPECTED PER MONTH */}
      <div className="card">
        <div className="mu sm">Collected / expected per month</div>

        {monthlyRows.map((month) => (
          <div className="item" key={month.monthKey}>
            <div style={{ width: "34px" }} className="mu sm">
              {month.shortMonthLabel}
            </div>

            <div className="m">
              <div className="bar" style={{ margin: 0 }}>
                <i style={{ width: `${month.percentage}%` }} />
              </div>
            </div>

            <div
              className="sm"
              style={{
                textAlign: "right",
                minWidth: "112px",
              }}
            >
              {formatCurrency(month.collectedRent)} /{" "}
              {formatCurrency(month.expectedRent)}
            </div>
          </div>
        ))}
      </div>

      {/* TENANTS */}
      <div className="card">
        <div className="mu sm">Per tenant</div>

        {tenantYearRows.length === 0 ? (
          <div className="empty">No data for this year.</div>
        ) : (
          tenantYearRows.map(({ tenant, paidRent, balance }) => (
            <div className="item" key={tenant._id || tenant.id}>
              <div className="slot">{tenant.slot}</div>

              <div className="m">
                <div>
                  <b>{tenant.name}</b>
                </div>

                <div className="mu sm">Paid {formatCurrency(paidRent)}</div>
              </div>

              {balance > 0 ? (
                <span className="chip unp">
                  {formatCurrency(balance)} short
                </span>
              ) : (
                <span className="chip paid">Clear</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Year;
// import React from "react";

// function Year({
//   tenants,
//   payments,
//   year,
//   onYear,
// }) {
//   const getMonthKey = (monthIndex) => {
//     return `${year}-${String(
//       monthIndex + 1,
//     ).padStart(2, "0")}`;
//   };

//   const getMonthLabel = (monthKey) => {
//     const [
//       yearValue,
//       monthValue,
//     ] = monthKey.split("-");

//     return new Date(
//       Number(yearValue),
//       Number(monthValue) - 1,
//       1,
//     ).toLocaleString("en-IN", {
//       month: "long",
//       year: "numeric",
//     });
//   };

//   const formatCurrency = (amount) => {
//     return (
//       "₹" +
//       Math.round(
//         Number(amount || 0),
//       ).toLocaleString("en-IN")
//     );
//   };

//   const getMonthIndex = (monthKey) => {
//     const [
//       yearValue,
//       monthValue,
//     ] = monthKey
//       .split("-")
//       .map(Number);

//     return (
//       yearValue * 12 +
//       monthValue -
//       1
//     );
//   };

//   const isTenantActive = (
//     tenant,
//     monthKey,
//   ) => {
//     return (
//       getMonthIndex(monthKey) >=
//         getMonthIndex(
//           tenant.start,
//         ) &&
//       (!tenant.end ||
//         getMonthIndex(monthKey) <=
//           getMonthIndex(
//             tenant.end,
//           ))
//     );
//   };

//   const getTenantYearRentPayments = (
//     tenant,
//   ) => {
//     return payments
//       .filter(
//         (payment) =>
//           payment.tenantId ===
//             tenant._id ||
//           payment.tenantId ===
//             tenant.id,
//       )
//       .filter(
//         (payment) =>
//           payment.kind === "rent" &&
//           payment.month?.startsWith(
//             String(year),
//           ),
//       );
//   };

//   const getPaymentTotal = (
//     paymentList,
//   ) => {
//     return paymentList.reduce(
//       (total, payment) =>
//         total +
//         Number(
//           payment.amount || 0,
//         ),
//       0,
//     );
//   };

//   const getYearPaymentTotal = (
//     paymentType,
//   ) => {
//     return getPaymentTotal(
//       payments.filter(
//         (payment) =>
//           payment.kind ===
//             paymentType &&
//           (payment.date || "").startsWith(
//             String(year),
//           ),
//       ),
//     );
//   };

//   // ----------------------------------------
//   // YEAR CALCULATIONS
//   // ----------------------------------------

//   let totalExpectedRent = 0;
//   let totalCollectedRent = 0;

//   const monthlyRows = Array.from(
//     { length: 12 },
//     (_, index) => {
//       const monthKey =
//         getMonthKey(index);

//       const activeTenants =
//         tenants.filter((tenant) =>
//           isTenantActive(
//             tenant,
//             monthKey,
//           ),
//         );

//       const expectedRent =
//         activeTenants.reduce(
//           (total, tenant) =>
//             total +
//             Number(
//               tenant.rent || 0,
//             ),
//           0,
//         );

//       const collectedRent =
//         getPaymentTotal(
//           payments.filter(
//             (payment) =>
//               payment.kind ===
//                 "rent" &&
//               payment.month ===
//                 monthKey,
//           ),
//         );

//       totalExpectedRent +=
//         expectedRent;

//       totalCollectedRent +=
//         collectedRent;

//       const percentage =
//         expectedRent
//           ? Math.min(
//               100,
//               (collectedRent /
//                 expectedRent) *
//                 100,
//             )
//           : 0;

//       return {
//         monthKey,
//         shortMonthLabel:
//           getMonthLabel(
//             monthKey,
//           ).slice(0, 3),
//         expectedRent,
//         collectedRent,
//         percentage,
//       };
//     },
//   );

//   const lateFeesCollected =
//     getYearPaymentTotal(
//       "latefee",
//     );

//   const depositsReceived =
//     getYearPaymentTotal(
//       "deposit",
//     );

//   const depositsRefunded =
//     getYearPaymentTotal(
//       "refund",
//     );

//   const rentShort = Math.max(
//     0,
//     totalExpectedRent -
//       totalCollectedRent,
//   );

//   // ----------------------------------------
//   // TENANT SUMMARY
//   // ----------------------------------------

//   const tenantYearRows =
//     tenants
//       .map((tenant) => {
//         let activeMonths = 0;

//         for (
//           let monthIndex = 0;
//           monthIndex < 12;
//           monthIndex++
//         ) {
//           const monthKey =
//             getMonthKey(
//               monthIndex,
//             );

//           if (
//             isTenantActive(
//               tenant,
//               monthKey,
//             )
//           ) {
//             activeMonths++;
//           }
//         }

//         if (activeMonths === 0) {
//           return null;
//         }

//         const paidRent =
//           getPaymentTotal(
//             getTenantYearRentPayments(
//               tenant,
//             ),
//           );

//         const expectedRent =
//           Number(
//             tenant.rent || 0,
//           ) * activeMonths;

//         const balance =
//           expectedRent -
//           paidRent;

//         return {
//           tenant,
//           paidRent,
//           balance,
//         };
//       })
//       .filter(Boolean)
//       .sort(
//         (a, b) =>
//           Number(a.tenant.slot) -
//           Number(b.tenant.slot),
//       );

//   // ----------------------------------------
//   // UI
//   // ----------------------------------------

//   return (
//     <div className="year-page">
//       <h1>Yearly summary</h1>

//       <div className="mon">
//         <button
//           className="sq"
//           onClick={() =>
//             onYear(year - 1)
//           }
//         >
//           ‹
//         </button>

//         <b>{year}</b>

//         <button
//           className="sq"
//           onClick={() =>
//             onYear(year + 1)
//           }
//         >
//           ›
//         </button>
//       </div>

//       <div className="grid">
//         <div className="card">
//           <div className="mu sm">
//             Rent collected
//           </div>

//           <div
//             className="big"
//             style={{
//               color: "var(--ok)",
//             }}
//           >
//             {formatCurrency(
//               totalCollectedRent,
//             )}
//           </div>
//         </div>

//         <div className="card">
//           <div className="mu sm">
//             Rent short
//           </div>

//           <div
//             className="big"
//             style={{
//               color: "var(--er)",
//             }}
//           >
//             {formatCurrency(
//               rentShort,
//             )}
//           </div>
//         </div>

//         <div className="card">
//           <div className="mu sm">
//             Late fees collected
//           </div>

//           <div className="big">
//             {formatCurrency(
//               lateFeesCollected,
//             )}
//           </div>
//         </div>

//         <div className="card">
//           <div className="mu sm">
//             Deposits in / out
//           </div>

//           <div
//             className="big"
//             style={{
//               fontSize: "16px",
//             }}
//           >
//             {formatCurrency(
//               depositsReceived,
//             )}{" "}
//             /{" "}
//             {formatCurrency(
//               depositsRefunded,
//             )}
//           </div>
//         </div>
//       </div>

//       {/* MONTHLY */}
//       <div className="card">
//         <div className="mu sm">
//           Collected / expected per month
//         </div>

//         {monthlyRows.map(
//           (month) => (
//             <div
//               className="item"
//               key={
//                 month.monthKey
//               }
//             >
//               <div
//                 style={{
//                   width: "34px",
//                 }}
//                 className="mu sm"
//               >
//                 {
//                   month.shortMonthLabel
//                 }
//               </div>

//               <div className="m">
//                 <div
//                   className="bar"
//                   style={{
//                     margin: 0,
//                   }}
//                 >
//                   <i
//                     style={{
//                       width: `${month.percentage}%`,
//                     }}
//                   />
//                 </div>
//               </div>

//               <div
//                 className="sm"
//                 style={{
//                   textAlign:
//                     "right",
//                   minWidth:
//                     "112px",
//                 }}
//               >
//                 {formatCurrency(
//                   month.collectedRent,
//                 )}{" "}
//                 /{" "}
//                 {formatCurrency(
//                   month.expectedRent,
//                 )}
//               </div>
//             </div>
//           ),
//         )}
//       </div>

//       {/* TENANTS */}
//       <div className="card">
//         <div className="mu sm">
//           Per tenant
//         </div>

//         {tenantYearRows.length ===
//         0 ? (
//           <div className="empty">
//             No data for this
//             year.
//           </div>
//         ) : (
//           tenantYearRows.map(
//             ({
//               tenant,
//               paidRent,
//               balance,
//             }) => (
//               <div
//                 className="item"
//                 key={
//                   tenant._id ||
//                   tenant.id
//                 }
//               >
//                 <div className="slot">
//                   {tenant.slot}
//                 </div>

//                 <div className="m">
//                   <div>
//                     <b>
//                       {
//                         tenant.name
//                       }
//                     </b>
//                   </div>

//                   <div className="mu sm">
//                     Paid{" "}
//                     {formatCurrency(
//                       paidRent,
//                     )}
//                   </div>
//                 </div>

//                 {balance > 0 ? (
//                   <span className="chip unp">
//                     {formatCurrency(
//                       balance,
//                     )}{" "}
//                     short
//                   </span>
//                 ) : (
//                   <span className="chip paid">
//                     Clear
//                   </span>
//                 )}
//               </div>
//             ),
//           )
//         )}
//       </div>
//     </div>
//   );
// }

// export default Year;