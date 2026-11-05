import React, { useState } from "react";
import "../styles/Dashboard.css";

function Dashboard({ slips = [], payments = [], tenants = [], bikes = [] }) {
  const [days, setDays] = useState(30);

  // DATE HELPERS
  const today = () => new Date().toLocaleDateString("en-CA");

  const addDays = (date, amount) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + amount);
    return d.toLocaleDateString("en-CA");
  };

  const getMonth = (date) =>
    date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");

  const monthIndex = (month) => {
    const [year, m] = month.split("-").map(Number);
    return year * 12 + m - 1;
  };

  const shiftMonth = (month, amount) => {
    const i = monthIndex(month) + amount;

    return Math.floor(i / 12) + "-" + String((i % 12) + 1).padStart(2, "0");
  };

  const monthName = (month) => {
    const [year, m] = month.split("-");

    return new Date(year, m - 1, 1).toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  // MONEY HELPERS
  const formatMoney = (amount) =>
    "₹" + Math.round(amount).toLocaleString("en-IN");

  const sum = (items) =>
    items.reduce((total, item) => total + Number(item.amount || 0), 0);

  const compact = (number) =>
    number >= 100000
      ? (number / 100000).toFixed(1) + "L"
      : number >= 1000
        ? (number / 1000).toFixed(number >= 10000 ? 0 : 1) + "k"
        : String(Math.round(number));

  // DAILY COLLECTION CALCULATION
  // DAILY COLLECTION CALCULATION
const getDayFigure = (item = {}) => {
  const count =
    item.start != null && item.end != null && item.end >= item.start
      ? Number(item.end) - Number(item.start) + 1
      : 0;

  const amount = count * Number(item.rate || 0);
  const cash = Number(item.cash || 0);
  const paytm = Number(item.paytm || 0);
  const overtime = Number(item.over || 0);
  const extra = Number(item.extra || 0);

  // Expected = Slip amount + Overtime + Others
  const expected = amount + overtime + extra;

  const noEntry = !cash && !paytm;

  // Avoid double-counting Others when Cash and PayTM are empty
  const collected = noEntry ? expected - extra : cash + paytm;

  return {
    count,
    amount,
    overtime,
    extra,
    expected,
    cash: noEntry ? expected - extra : cash,
    paytm,
    total: collected + extra,
    short: noEntry ? 0 : Math.max(0, expected - collected - extra),
  };
};
  // const getDayFigure = (item = {}) => {
  //   const count =
  //     item.start != null && item.end != null && item.end >= item.start
  //       ? Number(item.end) - Number(item.start) + 1
  //       : 0;

  //   const amount = count * Number(item.rate || 0);
  //   const cash = Number(item.cash || 0);
  //   const paytm = Number(item.paytm || 0);
  //   const overtime = Number(item.over || 0);

  //   const expected = amount + overtime;
  //   const noEntry = !cash && !paytm;
  //   const total = noEntry ? expected : cash + paytm;

  //   return {
  //     count,
  //     amount,
  //     overtime,
  //     expected,
  //     cash: noEntry ? expected : cash,
  //     paytm,
  //     total,
  //     short: noEntry ? 0 : Math.max(0, expected - total),
  //   };
  // };

  // CHART DATA
  const currentDate = today();
  const startDate = addDays(currentDate, -(days - 1));

  const dailyRecords = slips
    .filter((item) => item.date >= startDate && item.date <= currentDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      date: item.date,
      ...getDayFigure(item),
    }));

  const recordCount = dailyRecords.length || 1;

  const average = (key) =>
    dailyRecords.reduce((total, item) => total + item[key], 0) / recordCount;

  const averageCollection = average("total");
  const averageSlips = average("count");
  const averageCash = average("cash");
  const averagePaytm = average("paytm");
  const averageOvertime = average("overtime");
  const averageExtra = average("extra");
  const averageShort = average("short");

  const totalCollection = dailyRecords.reduce(
    (total, item) => total + item.total,
    0,
  );

  const bestDay = dailyRecords.length
    ? dailyRecords.reduce((a, b) => (b.total > a.total ? b : a))
    : null;

  const lowestDay = dailyRecords.length
    ? dailyRecords.reduce((a, b) => (b.total < a.total ? b : a))
    : null;

  const cashPercentage =
    averageCash + averagePaytm
      ? Math.round((averageCash / (averageCash + averagePaytm)) * 100)
      : 0;

  // CAR RENT CALCULATION
  const currentMonth = getMonth(new Date());

  const rentPayments = payments.filter(
    (payment) =>
      payment.kind === "rent" &&
      monthIndex(payment.month) <= monthIndex(currentMonth),
  );

  const monthsList = [
    ...rentPayments.map((payment) => payment.month),
    ...tenants.map((tenant) => tenant.start),
  ]
    .filter(Boolean)
    .sort();

  const monthCount = monthsList.length
    ? monthIndex(currentMonth) - monthIndex(monthsList[0]) + 1
    : 0;

  const averageRent = monthCount ? sum(rentPayments) / monthCount : 0;

  const occupiedSlots = tenants.filter(
    (tenant) =>
      !tenant.end || monthIndex(tenant.end) >= monthIndex(currentMonth),
  ).length;

  const averageRentPerSlot = occupiedSlots ? averageRent / occupiedSlots : 0;

  // BIKE RENT CALCULATION
  const bikeDays = {};

  bikes.forEach((bike) => {
    bikeDays[bike.date] = (bikeDays[bike.date] || 0) + Number(bike.amount || 0);
  });

  const bikeDayCount = Object.keys(bikeDays).length;
  const bikeTotal = sum(bikes);

  const averageBikeRent = bikeDayCount ? bikeTotal / bikeDayCount : 0;

  // WEEK-WISE IN-SLIPS
  const weekStart = (date) =>
    addDays(date, -((new Date(date + "T00:00:00").getDay() + 6) % 7));

  const slipCount = (from, to) =>
    slips
      .filter((item) => item.date >= from && item.date <= to)
      .reduce((total, item) => total + getDayFigure(item).count, 0);

  const currentWeek = weekStart(currentDate);

  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(currentWeek, -7 * (7 - i));

    return {
      label: start.slice(8) + "/" + start.slice(5, 7),
      value: slipCount(start, addDays(start, 6)),
    };
  });

  // MONTH-WISE IN-SLIPS
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = shiftMonth(currentMonth, -(5 - i));

    const count = slips
      .filter((item) => item.date.slice(0, 7) === month)
      .reduce((total, item) => total + getDayFigure(item).count, 0);

    return {
      label: monthName(month).slice(0, 3),
      value: count,
    };
  });
  // COMPARISON
  const changeText = (current, previous, label) => {
    if (!previous) return "";

    const percentage = Math.abs(
      Math.round(((current - previous) / previous) * 100),
    );

    return `${current >= previous ? "▲" : "▼"} ${percentage}% vs ${label}`;
  };
  // DAILY COLLECTION · LAST 6 MONTHS
  const getMonthSummary = (month) => {
  const monthSlips = slips.filter(
    (item) => item.date?.slice(0, 7) === month,
  );

  return monthSlips.reduce(
    (total, item) => {
      const figure = getDayFigure(item);

      total.n += figure.count;
      total.cash += figure.cash;
      total.pt += figure.paytm;
      total.ot += figure.overtime; // ADD THIS
      total.extra += figure.extra;
      total.total += figure.total;
      total.short += figure.short;

      return total;
    },
    {
      n: 0,
      cash: 0,
      pt: 0,
      ot: 0,
      extra: 0,
      total: 0,
      short: 0,
    },
  );
};
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const month = shiftMonth(currentMonth, -(5 - i));
    const summary = getMonthSummary(month);

    return {
      month,
      label: monthName(month).slice(0, 3),
      value: summary.total,
      summary,
    };
  });

  const revenueChange = changeText(
    monthlyRevenue[5].value,
    monthlyRevenue[4].value,
    "last month",
  );

  const revenueTotals = monthlyRevenue.reduce(
  (total, item) => ({
    n: total.n + item.summary.n,
    cash: total.cash + item.summary.cash,
    pt: total.pt + item.summary.pt,
    ot: total.ot + item.summary.ot,
    extra: total.extra + item.summary.extra,
    total: total.total + item.value,
    short: total.short + item.summary.short,
  }),
  { n: 0, cash: 0, pt: 0, ot: 0, extra: 0, total: 0, short: 0 },
);

  // SUMMARY CARD
  const SummaryCard = ({ title, value, subtitle, color }) => (
    <div className="card">
      <div className="mu sm">{title}</div>

      <div className="big" style={color ? { color: `var(--${color})` } : {}}>
        {value}
      </div>

      <div className="mu sm">{subtitle || "\u00A0"}</div>
    </div>
  );

  // BAR CHART
  const BarChart = ({ items }) => {
    const W = 320;
    const H = 150;
    const L = 8;
    const T = 18;
    const B = 22;

    const max = Math.max(...items.map((item) => item.value), 1);

    const n = items.length;
    const bw = (W - 2 * L) / n;
    const ih = H - T - B;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img">
        {items.map((item, i) => {
          const h = (ih * item.value) / max;
          const x = L + i * bw + bw * 0.15;
          const y = T + ih - h;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={bw * 0.7}
                height={h}
                rx="3"
                className="ch-b"
                opacity={i === n - 1 ? 1 : 0.55}
              />

              <text
                x={x + bw * 0.35}
                y={y - 4}
                textAnchor="middle"
                className="ch-t"
              >
                {item.value}
              </text>

              <text
                x={x + bw * 0.35}
                y={H - 6}
                textAnchor="middle"
                className="ch-t"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // BAR CHART
  const BarChart2 = ({ items, money = false }) => {
    const W = 320;
    const H = 150;
    const L = 8;
    const T = 18;
    const B = 22;

    const max = Math.max(...items.map((item) => item.value), 1);

    const n = items.length;
    const bw = (W - 2 * L) / n;
    const ih = H - T - B;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img">
        {items.map((item, i) => {
          const h = (ih * item.value) / max;
          const x = L + i * bw + bw * 0.15;
          const y = T + ih - h;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={bw * 0.7}
                height={h}
                rx="3"
                className="ch-b"
                opacity={i === n - 1 ? 1 : 0.55}
              />

              <text
                x={x + bw * 0.35}
                y={y - 4}
                textAnchor="middle"
                className="ch-t"
              >
                {money ? compact(item.value) : item.value}
              </text>

              <text
                x={x + bw * 0.35}
                y={H - 6}
                textAnchor="middle"
                className="ch-t"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };
  // LINE CHART
  const LineChart = ({ points, avg }) => {
    if (!points.length) {
      return (
        <div className="empty">No daily collection recorded in this range</div>
      );
    }

    const width = 320;
    const height = 160;
    const left = 40;
    const right = 8;
    const top = 10;
    const bottom = 24;

    const max = Math.max(...points.map((point) => point.value), 1);

    const innerWidth = width - left - right;
    const innerHeight = height - top - bottom;

    const X = (i) =>
      left +
      (points.length < 2
        ? innerWidth / 2
        : (i * innerWidth) / (points.length - 1));

    const Y = (value) => top + innerHeight * (1 - value / max);

    const linePoints = points
      .map((point, i) => `${X(i)},${Y(point.value)}`)
      .join(" ");

    const polygonPoints = `${X(0)},${Y(0)} ${linePoints} ${X(points.length - 1)},${Y(0)}`;

    const averageY = Y(avg);

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label="Daily collection trend"
      >
        {[0, 1, 2, 3].map((i) => {
          const value = (max * i) / 3;
          const y = Y(value);

          return (
            <g key={i}>
              <line
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
                className="ch-g"
              />

              <text x={left - 4} y={y + 3} textAnchor="end" className="ch-t">
                {compact(value)}
              </text>
            </g>
          );
        })}

        <polygon points={polygonPoints} className="ch-a" />

        <polyline points={linePoints} className="ch-l" />

        {points.map((point, i) => (
          <circle key={i} cx={X(i)} cy={Y(point.value)} r="3" className="ch-d">
            <title>
              {point.label}: {formatMoney(point.value)}
            </title>
          </circle>
        ))}

        <line
          x1={left}
          x2={width - right}
          y1={averageY}
          y2={averageY}
          className="ch-v"
        />

        <text
          x={width - right}
          y={averageY - 3}
          textAnchor="end"
          className="ch-t"
        >
          avg {compact(avg)}
        </text>

        <text x={left} y={height - 6} className="ch-t">
          {points[0].label}
        </text>

        <text
          x={width - right}
          y={height - 6}
          textAnchor="end"
          className="ch-t"
        >
          {points[points.length - 1].label}
        </text>
      </svg>
    );
  };

  // DASHBOARD UI
  return (
    <div className="dashboard-page">
      <div className="row dashboard-heading">
        <h1>Dashboard</h1>

        <div className="rng">
          {[7, 30, 90].map((number) => (
            <button
              type="button"
              key={number}
              className={days === number ? "on" : ""}
              onClick={() => setDays(number)}
            >
              {number}d
            </button>
          ))}
        </div>
      </div>

      <div className="mu sm dashboard-subtitle">
        Last {days} days · {dailyRecords.length} day
        {dailyRecords.length === 1 ? "" : "s"} with collection recorded
      </div>

      {/* COLLECTION SUMMARY */}
      <div className="grid">
        <SummaryCard
          title="Avg daily collection"
          value={formatMoney(averageCollection)}
          subtitle={`Total ${formatMoney(totalCollection)}`}
          color="ok"
        />

        <SummaryCard
          title="Avg in-slips / day"
          value={Math.round(averageSlips * 10) / 10}
        />

        <SummaryCard
          title="Avg cash / day"
          value={formatMoney(averageCash)}
          subtitle={`${cashPercentage}% of cash + PayTM`}
        />

        <SummaryCard
          title="Avg PayTM / day"
          value={formatMoney(averagePaytm)}
          subtitle={`${100 - cashPercentage}% of cash + PayTM`}
        />

        <SummaryCard
          title="Avg overtime / day"
          value={formatMoney(averageOvertime)}
        />
        <SummaryCard
  title="Avg Others / day"
  value={formatMoney(averageExtra)}
/>

        <SummaryCard
          title="Avg short / day"
          value={formatMoney(averageShort)}
          color="er"
        />
      </div>

      {/* CASH VS PAYTM */}
      <div className="card">
        <div className="mu sm">Cash vs PayTM</div>

        <div className="bar dashboard-payment-bar">
          <i style={{ width: `${cashPercentage}%` }} />
        </div>

        <div className="row sm dashboard-payment-labels">
          <span>Cash {cashPercentage}%</span>
          <span>PayTM {100 - cashPercentage}%</span>
        </div>
      </div>

      {/* CAR RENT */}
      <div className="grid">
        <SummaryCard
          title="Car rent · avg / month"
          value={formatMoney(averageRent)}
          subtitle={
            monthCount
              ? `over ${monthCount} month${monthCount > 1 ? "s" : ""}`
              : "no rent recorded"
          }
        />

        <SummaryCard
          title="Car rent · avg / slot"
          value={formatMoney(averageRentPerSlot)}
          subtitle={`${occupiedSlots} slots occupied now`}
        />
      </div>

      {/* BIKE RENT */}
      <div className="card">
        <div className="row">
          <div>
            <div className="mu sm">Bike rent · avg / day</div>

            <div className="big">{formatMoney(averageBikeRent)}</div>
          </div>

          <div className="mu sm dashboard-bike-info">
            {bikeDayCount
              ? `${bikeDayCount} days · ${formatMoney(bikeTotal)} total`
              : "No bike-rent entries (Bike tab was removed)"}
          </div>
        </div>
      </div>

      {/* DAILY COLLECTION LINE CHART */}
      <div className="card">
        <b>Daily collection · ups & downs</b>

        <LineChart
          points={dailyRecords.map((item) => ({
            label: item.date.slice(8) + "/" + item.date.slice(5, 7),
            value: item.total,
          }))}
          avg={averageCollection}
        />

        {bestDay && (
          <div className="row sm dashboard-high-low">
            <span>
              Highest:{" "}
              <b className="dashboard-high">{formatMoney(bestDay.total)}</b> (
              {bestDay.date.slice(8)}/{bestDay.date.slice(5, 7)})
            </span>

            <span>
              Lowest:{" "}
              <b className="dashboard-low">{formatMoney(lowestDay.total)}</b> (
              {lowestDay.date.slice(8)}/{lowestDay.date.slice(5, 7)})
            </span>
          </div>
        )}
      </div>

      {/* WEEKLY IN-SLIPS */}
      <div className="card">
        <div className="row">
          <b>In-slips · week-wise</b>

          <span className="mu sm">
            {changeText(weeklyData[7].value, weeklyData[6].value, "last week")}
          </span>
        </div>

        <div className="mu sm">
          Weeks starting Monday (dd/mm) · latest week highlighted
        </div>

        <BarChart items={weeklyData} />
      </div>

      {/* MONTHLY IN-SLIPS */}
      <div className="card">
        <div className="row">
          <b>In-slips · month-wise</b>

          <span className="mu sm">
            {changeText(
              monthlyData[5].value,
              monthlyData[4].value,
              "last month",
            )}
          </span>
        </div>

        <BarChart items={monthlyData} />
      </div>

      {/* DAILY COLLECTION · MONTH-WISE REVENUE */}
      <div className="card">
        <div className="row">
          <b>Daily collection · month-wise revenue</b>

          <span className="mu sm">{revenueChange}</span>
        </div>

        <div className="mu sm">Total collected per month (last 6 months)</div>

        <BarChart2 items={monthlyRevenue} money />

        <div style={{ overflowX: "auto", marginTop: "8px" }}>
  <div style={{ minWidth: "500px" }}>
    <div className="dw mu" style={{ cursor: "default" }}>
      <span>Month</span>
      <span>Slips</span>
      <span>Cash</span>
      <span>PayTM</span>
      <span>Overtime</span>
      <span>Others</span>
      <span>Total</span>
      <span>Short</span>
    </div>

    {monthlyRevenue.map((item) => (
      <div
        className="dw"
        style={{ cursor: "default" }}
        key={item.month}
      >
        <span>
          {item.label} {item.month.slice(2, 4)}
        </span>

        <span>{item.summary.n}</span>

        <span>{formatMoney(item.summary.cash)}</span>

        <span>{formatMoney(item.summary.pt)}</span>

        <span>{formatMoney(item.summary.ot)}</span>

        <span>{formatMoney(item.summary.extra)}</span>

        <b>{formatMoney(item.value)}</b>

        <span
          style={{
            color: item.summary.short ? "var(--er)" : "var(--mu)",
          }}
        >
          {formatMoney(item.summary.short)}
        </span>
      </div>
    ))}

    <div className="dw tot" style={{ cursor: "default" }}>
      <span>6 mo.</span>

      <span>{revenueTotals.n}</span>

      <span>{formatMoney(revenueTotals.cash)}</span>

      <span>{formatMoney(revenueTotals.pt)}</span>

      <span>{formatMoney(revenueTotals.ot)}</span>

      <span>{formatMoney(revenueTotals.extra)}</span>

      <b>{formatMoney(revenueTotals.total)}</b>

      <span>{formatMoney(revenueTotals.short)}</span>
    </div>
  </div>
</div>
      </div>
    </div>
  );
}

export default Dashboard;