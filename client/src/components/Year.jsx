import React from "react";

function Year({
  tenants,
  payments,
  year,
  onYear,
}) {
  const getMonthKey = (monthIndex) => {
    return `${year}-${String(
      monthIndex + 1,
    ).padStart(2, "0")}`;
  };

  const getMonthLabel = (monthKey) => {
    const [
      yearValue,
      monthValue,
    ] = monthKey.split("-");

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
    return (
      "₹" +
      Math.round(
        Number(amount || 0),
      ).toLocaleString("en-IN")
    );
  };

  const getMonthIndex = (monthKey) => {
    const [
      yearValue,
      monthValue,
    ] = monthKey
      .split("-")
      .map(Number);

    return (
      yearValue * 12 +
      monthValue -
      1
    );
  };

  const isTenantActive = (
    tenant,
    monthKey,
  ) => {
    return (
      getMonthIndex(monthKey) >=
        getMonthIndex(
          tenant.start,
        ) &&
      (!tenant.end ||
        getMonthIndex(monthKey) <=
          getMonthIndex(
            tenant.end,
          ))
    );
  };

  const getTenantYearRentPayments = (
    tenant,
  ) => {
    return payments
      .filter(
        (payment) =>
          payment.tenantId ===
            tenant._id ||
          payment.tenantId ===
            tenant.id,
      )
      .filter(
        (payment) =>
          payment.kind === "rent" &&
          payment.month?.startsWith(
            String(year),
          ),
      );
  };

  const getPaymentTotal = (
    paymentList,
  ) => {
    return paymentList.reduce(
      (total, payment) =>
        total +
        Number(
          payment.amount || 0,
        ),
      0,
    );
  };

  const getYearPaymentTotal = (
    paymentType,
  ) => {
    return getPaymentTotal(
      payments.filter(
        (payment) =>
          payment.kind ===
            paymentType &&
          (payment.date || "").startsWith(
            String(year),
          ),
      ),
    );
  };

  // ----------------------------------------
  // YEAR CALCULATIONS
  // ----------------------------------------

  let totalExpectedRent = 0;
  let totalCollectedRent = 0;

  const monthlyRows = Array.from(
    { length: 12 },
    (_, index) => {
      const monthKey =
        getMonthKey(index);

      const activeTenants =
        tenants.filter((tenant) =>
          isTenantActive(
            tenant,
            monthKey,
          ),
        );

      const expectedRent =
        activeTenants.reduce(
          (total, tenant) =>
            total +
            Number(
              tenant.rent || 0,
            ),
          0,
        );

      const collectedRent =
        getPaymentTotal(
          payments.filter(
            (payment) =>
              payment.kind ===
                "rent" &&
              payment.month ===
                monthKey,
          ),
        );

      totalExpectedRent +=
        expectedRent;

      totalCollectedRent +=
        collectedRent;

      const percentage =
        expectedRent
          ? Math.min(
              100,
              (collectedRent /
                expectedRent) *
                100,
            )
          : 0;

      return {
        monthKey,
        shortMonthLabel:
          getMonthLabel(
            monthKey,
          ).slice(0, 3),
        expectedRent,
        collectedRent,
        percentage,
      };
    },
  );

  const lateFeesCollected =
    getYearPaymentTotal(
      "latefee",
    );

  const depositsReceived =
    getYearPaymentTotal(
      "deposit",
    );

  const depositsRefunded =
    getYearPaymentTotal(
      "refund",
    );

  const rentShort = Math.max(
    0,
    totalExpectedRent -
      totalCollectedRent,
  );

  // ----------------------------------------
  // TENANT SUMMARY
  // ----------------------------------------

  const tenantYearRows =
    tenants
      .map((tenant) => {
        let activeMonths = 0;

        for (
          let monthIndex = 0;
          monthIndex < 12;
          monthIndex++
        ) {
          const monthKey =
            getMonthKey(
              monthIndex,
            );

          if (
            isTenantActive(
              tenant,
              monthKey,
            )
          ) {
            activeMonths++;
          }
        }

        if (activeMonths === 0) {
          return null;
        }

        const paidRent =
          getPaymentTotal(
            getTenantYearRentPayments(
              tenant,
            ),
          );

        const expectedRent =
          Number(
            tenant.rent || 0,
          ) * activeMonths;

        const balance =
          expectedRent -
          paidRent;

        return {
          tenant,
          paidRent,
          balance,
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          Number(a.tenant.slot) -
          Number(b.tenant.slot),
      );

  // ----------------------------------------
  // UI
  // ----------------------------------------

  return (
    <div className="year-page">
      <h1>Yearly summary</h1>

      <div className="mon">
        <button
          className="sq"
          onClick={() =>
            onYear(year - 1)
          }
        >
          ‹
        </button>

        <b>{year}</b>

        <button
          className="sq"
          onClick={() =>
            onYear(year + 1)
          }
        >
          ›
        </button>
      </div>

      <div className="grid">
        <div className="card">
          <div className="mu sm">
            Rent collected
          </div>

          <div
            className="big"
            style={{
              color: "var(--ok)",
            }}
          >
            {formatCurrency(
              totalCollectedRent,
            )}
          </div>
        </div>

        <div className="card">
          <div className="mu sm">
            Rent short
          </div>

          <div
            className="big"
            style={{
              color: "var(--er)",
            }}
          >
            {formatCurrency(
              rentShort,
            )}
          </div>
        </div>

        <div className="card">
          <div className="mu sm">
            Late fees collected
          </div>

          <div className="big">
            {formatCurrency(
              lateFeesCollected,
            )}
          </div>
        </div>

        <div className="card">
          <div className="mu sm">
            Deposits in / out
          </div>

          <div
            className="big"
            style={{
              fontSize: "16px",
            }}
          >
            {formatCurrency(
              depositsReceived,
            )}{" "}
            /{" "}
            {formatCurrency(
              depositsRefunded,
            )}
          </div>
        </div>
      </div>

      {/* MONTHLY */}
      <div className="card">
        <div className="mu sm">
          Collected / expected per month
        </div>

        {monthlyRows.map(
          (month) => (
            <div
              className="item"
              key={
                month.monthKey
              }
            >
              <div
                style={{
                  width: "34px",
                }}
                className="mu sm"
              >
                {
                  month.shortMonthLabel
                }
              </div>

              <div className="m">
                <div
                  className="bar"
                  style={{
                    margin: 0,
                  }}
                >
                  <i
                    style={{
                      width: `${month.percentage}%`,
                    }}
                  />
                </div>
              </div>

              <div
                className="sm"
                style={{
                  textAlign:
                    "right",
                  minWidth:
                    "112px",
                }}
              >
                {formatCurrency(
                  month.collectedRent,
                )}{" "}
                /{" "}
                {formatCurrency(
                  month.expectedRent,
                )}
              </div>
            </div>
          ),
        )}
      </div>

      {/* TENANTS */}
      <div className="card">
        <div className="mu sm">
          Per tenant
        </div>

        {tenantYearRows.length ===
        0 ? (
          <div className="empty">
            No data for this
            year.
          </div>
        ) : (
          tenantYearRows.map(
            ({
              tenant,
              paidRent,
              balance,
            }) => (
              <div
                className="item"
                key={
                  tenant._id ||
                  tenant.id
                }
              >
                <div className="slot">
                  {tenant.slot}
                </div>

                <div className="m">
                  <div>
                    <b>
                      {
                        tenant.name
                      }
                    </b>
                  </div>

                  <div className="mu sm">
                    Paid{" "}
                    {formatCurrency(
                      paidRent,
                    )}
                  </div>
                </div>

                {balance > 0 ? (
                  <span className="chip unp">
                    {formatCurrency(
                      balance,
                    )}{" "}
                    short
                  </span>
                ) : (
                  <span className="chip paid">
                    Clear
                  </span>
                )}
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}

export default Year;