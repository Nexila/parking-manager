import React, { useEffect, useState } from "react";
import { today, inr } from "../utils";
import "../styles/Daily.css";
// Same as original HTML snap()
function snap(value) {
  if (!value) return "";
  return (
    value.slice(0, 14) +
    String(Math.floor(Number(value.slice(14, 16)) / 15) * 15).padStart(2, "0")
  );
}

// Same as original HTML nowDT()
function nowDT() {
  const date = today();
  const time = new Date().toTimeString().slice(0, 5);
  return date + "T" + time;
}

// Same calculation as original HTML dayFig()
function dayFig(x = {}) {
  const n =
    x.start != null && x.end != null && x.end >= x.start
      ? x.end - x.start + 1
      : 0;

  const amt = n * (x.rate || 0);
  const c = Number(x.cash || 0);
  const p = Number(x.paytm || 0);
  const o = Number(x.over || 0);
  const extra = Number(x.extra || 0);

  // Expected includes Others
  const exp = amt + o + extra;

  const none = !c && !p;
  const col = none ? exp : c + p;

  return {
    n,
    amt,
    ot: o,
    exp,
    cash: none ? exp : c,
    pt: p,
    extra,
    total: col + extra,
    short: none ? 0 : Math.max(0, exp - col - extra),
    diff: none ? 0 : col + extra - exp,
    entered: !none,
  };
}
// function dayFig(x = {}) {
//   const n =
//     x.start != null && x.end != null && x.end >= x.start
//       ? x.end - x.start + 1
//       : 0;

//   const amt = n * (x.rate || 0);
//   const c = x.cash || 0;
//   const p = x.paytm || 0;
//   const o = x.over || 0;

//   const exp = amt + o;
//   const none = !c && !p;
//   const col = none ? exp : c + p;

//   return {
//     n,
//     amt,
//     ot: o,
//     exp,
//     cash: none ? exp : c,
//     pt: p,
//     total: col,
//     short: none ? 0 : Math.max(0, exp - col),
//     diff: none ? 0 : col - exp,
//     entered: !none,
//   };
// }

const MN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getDMYears(slips, dm) {
  const currentYear = new Date().getFullYear();

  const years = new Set([currentYear - 1, currentYear, Number(dm.slice(0, 4))]);

  slips.forEach((x) => {
    if (x.date) years.add(Number(x.date.slice(0, 4)));
  });

  return [...years].sort((a, b) => a - b);
}

function Daily({ slips = [], settings = {}, day, setDay, onSave, onDelete }) {
  const savedSlip = slips.find((x) => x.date === day);

  // const [form, setForm] = useState({
  //   from: snap(nowDT()),
  //   to: snap(nowDT()),
  //   start: "",
  //   end: "",
  //   rate: settings.slipRate || 20,
  //   over: "",
  //   cash: "",
  //   paytm: "",
  // });
  const [form, setForm] = useState({
  from: snap(nowDT()),
  to: snap(nowDT()),
  start: "",
  end: "",
  rate: settings.slipRate || 20,
  over: "",
  extra: "",
  cash: "",
  paytm: "",
});
  const [dm, setDm] = useState(day.slice(0, 7)); // Year-Month for month summary

  // Load saved values when selected day changes
  // Load saved values when selected day changes
  useEffect(() => {
    const saved = slips.find((x) => x.date === day);

    if (saved) {
      setForm({
        from: saved.from || snap(nowDT()),
        to: saved.to || snap(nowDT()),
        start: saved.start ?? "",
        end: saved.end ?? "",
        rate: saved.rate ?? settings.slipRate ?? 20,
        over: saved.over ?? "",
        cash: saved.cash ?? "",
        paytm: saved.paytm ?? "",
        extra: saved.extra ?? "",
      });
    } else {
      setForm({
        from: day + "T00:00",
        to: day + "T23:45",
        start: "",
        end: "",
        rate: settings.slipRate || 20,
        over: "",
         extra: "",
        cash: "",
        paytm: "",
      });
    }
  }, [day, slips, settings.slipRate]);
  useEffect(() => {
    setDm(day.slice(0, 7));
  }, [day]);
  // Same as original dayFig()
  const result = dayFig({
    ...form,
    start: form.start === "" ? null : Number(form.start),
    end: form.end === "" ? null : Number(form.end),
    rate: Number(form.rate) || 0,
    over: Number(form.over) || 0,
    cash: Number(form.cash) || 0,
    paytm: Number(form.paytm) || 0,
    extra: Number(form.extra) || 0,
  });

  const update = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Same as original dshift()
  const changeDay = (amount) => {
    setDay((prevDay) => {
      const date = new Date(`${prevDay}T00:00:00`);

      date.setDate(date.getDate() + amount);

      return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
      );
    });
  };

  // Same as original saveSlip()
  const handleSave = () => {
    const start = form.start === "" ? null : Number(form.start);
    const end = form.end === "" ? null : Number(form.end);
    const rate = Number(form.rate) || 0;

    if (start !== null && end !== null && end < start) {
      alert("End number must not be less than start number.");
      return;
    }

    const from = snap(form.from);
    const to = snap(form.to);

    if (!from || !to) {
      alert("Select the From and To date & time.");
      return;
    }

    if (to < from) {
      alert("To date & time must be after From.");
      return;
    }

    onSave({
      from,
      to,
      start,
      end,
      rate,
      cash: Number(form.cash) || 0,
      paytm: Number(form.paytm) || 0,
      over: Number(form.over) || 0,
      short: result.short,
      extra: Number(form.extra) || 0,
    });
  };

  function DateTimePicker({ label, value, onChange, onDateChange }) {
    const [date, time] = value.split("T");
    const [hour, minute] = (time || "00:00").split(":");

    const updateTime = (newHour, newMinute) => {
      onChange(`${date}T${newHour}:${newMinute}`);
    };

    return (
      <div className="daily-datetime">
        <label>{label}</label>

        <div className="daily-datetime-row">
          {/* DATE */}
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
          />

          {/* HOUR */}
          <select
            value={hour}
            onChange={(e) => updateTime(e.target.value, minute)}
          >
            {Array.from({ length: 24 }, (_, i) => {
              const h = String(i).padStart(2, "0");
              return (
                <option key={h} value={h}>
                  {h}
                </option>
              );
            })}
          </select>

          {/* MINUTE */}
          <select
            value={minute}
            onChange={(e) => updateTime(hour, e.target.value)}
          >
            {["00", "15", "30", "45"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
  const input = (name, label, readOnly = false) => (
    <div>
      <label>{label}</label>
      <input
        type="number"
        inputMode="numeric"
        name={name}
        value={name === "short" ? result.short : form[name]}
        onChange={update}
        readOnly={readOnly}
      />
    </div>
  );
  const monthSlips = slips
    .filter((x) => (x.date || "").slice(0, 7) === dm)
    .sort((a, b) => a.date.localeCompare(b.date));

  const monthSummary = monthSlips.reduce(
    (acc, x) => {
      const f = dayFig(x);

      acc.days += 1;
      acc.n += f.n;
      acc.amt += f.amt;
      acc.ot += f.ot;
      acc.exp += f.exp;
      acc.cash += f.cash;
      acc.pt += f.pt;
      acc.short += f.short;
      acc.extra += f.extra;
      acc.total += f.total;
      acc.excess += Math.max(0, f.diff);

      return acc;
    },
    {
      days: 0,
      n: 0,
      amt: 0,
      ot: 0,
      exp: 0,
      cash: 0,
      pt: 0,
      short: 0,
      extra: 0,
      total: 0,
      excess: 0,
    },
  );

  const monthLabel = new Date(
    Number(dm.slice(0, 4)),
    Number(dm.slice(5, 7)) - 1,
    1,
  ).toLocaleString("en-IN", { month: "long", year: "numeric" });

  const monthRow = (label, value, color, bold = false) => (
    <div className={`item ${bold ? "tot" : ""}`} key={label}>
      <div className="m">{label}</div>
      <b style={color ? { color: `var(--${color})` } : {}}>{value}</b>
    </div>
  );

  const weekday = (date) =>
    new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
      weekday: "short",
    });
  return (
    <div className="daily-page">
      <div className="daily-heading">
        <h2>Daily collection</h2>

        <div className="daily-month-filter">
          <select
            value={dm.slice(5, 7)}
            onChange={(e) => setDm(`${dm.slice(0, 4)}-${e.target.value}`)}
          >
            {MN.map((name, index) => (
              <option key={name} value={String(index + 1).padStart(2, "0")}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={dm.slice(0, 4)}
            onChange={(e) => setDm(`${e.target.value}-${dm.slice(5, 7)}`)}
          >
            {getDMYears(slips, dm).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* COLLECTION PERIOD */}
      <div className="card">
        <div className="row">
          <b>Collection period</b>

          <div>
            <button type="button" onClick={() => changeDay(-1)}>
              ‹
            </button>

            <button type="button" onClick={() => changeDay(1)}>
              ›
            </button>
          </div>
        </div>

        <DateTimePicker
          label="From (date & time)"
          value={form.from}
          onChange={(value) => setForm((prev) => ({ ...prev, from: value }))}
          onDateChange={(date) => {
            setForm((prev) => ({
              ...prev,
              from: `${date}T00:00`,
            }));
          }}
        />

        <DateTimePicker
          label="To (date & time)"
          value={form.to}
          onChange={(value) => setForm((prev) => ({ ...prev, to: value }))}
          onDateChange={(date) => {
            setForm((prev) => ({
              ...prev,
              to: `${date}T${prev.to.split("T")[1] || "00:00"}`,
            }));
          }}
        />
      </div>

      {/* IN-SLIP */}
      <div className="card">
        <b>In-slip</b>

        <div className="two">
          {input("start", "Start no.")}
          {input("end", "End no.")}
        </div>

        <label>Per in-slip cost (₹)</label>

        <div className="row daily-rate">
          <input
            type="number"
            name="rate"
            value={form.rate}
            onChange={update}
          />

          {[15, 20, 25].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setForm({ ...form, rate })}
            >
              ₹{rate}
            </button>
          ))}
        </div>

        <div className="note-daily-calculation">
  Slips used: <b>{result.n}</b> × ₹{form.rate} ={" "}
  <b>{inr(result.amt)}</b>
  {" + overtime "}
  <b>{inr(result.ot)}</b>
  {" + others "}
  <b>{inr(result.extra)}</b>
  {" = "}
  <b>{inr(result.exp)}</b>
</div>

        <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  }}
>
  {input("over", "Overtime collection (₹)")}
  {input("extra", "Other amount (₹)")}
</div>

<div className="daily-three">
  {input("cash", "Cash ₹")}
  {input("paytm", "PayTM ₹")}
  {input("short", "Short ₹ (auto)", true)}
</div>

        <div className="row daily-save">
          <span className="mu sm">
            {savedSlip
              ? `Saved: ${savedSlip.from?.replace("T", " ")} → ${savedSlip.to?.replace("T", " ")}`
              : "Not saved yet"}
          </span>

          <button className="pri" onClick={handleSave}>
            Save
          </button>
        </div>

        {/* {savedSlip && (
          <button
            className="dng"
            onClick={() => {
              if (window.confirm("Delete this day's collection?")) {
                onDelete(day);
              }
            }}
          >
            Delete collection
          </button>
        )} */}
      </div>

      {/* DAY SUMMARY */}
      <div className="card">
        <b>Day summary</b>

        <div className="item">
          <div className="m">Slip amount (slips × cost)</div>
          <b>{inr(result.amt)}</b>
        </div>

        <div className="item">
          <div className="m">+ Overtime</div>
          <b>{inr(result.ot)}</b>
        </div>
        <div className="item">
  <div className="m">+ Others</div>
  <b>{inr(result.extra)}</b>
</div>

        <div className="item">
          <div className="m">Expected (slip + overtime + others)</div>
          <b>{inr(result.exp)}</b>
        </div>

        <div className="item">
          <div className="m">Cash</div>
          <b>{inr(result.cash)}</b>
        </div>

        <div className="item">
          <div className="m">PayTM</div>
          <b>{inr(result.pt)}</b>
        </div>

        <div className="item">
          <div className="m">Short amount</div>
          <b style={{ color: "var(--er)" }}>{inr(result.short)}</b>
        </div>

        <div className="item tot">
          <div className="m">Total collected</div>
          <b style={{ color: "var(--ok)" }}>{inr(result.total)}</b>
        </div>

        {result.entered ? (
          <p className="mu sm">
            Cash + PayTM vs expected:{" "}
            <b style={{ color: result.diff < 0 ? "var(--er)" : "var(--ok)" }}>
              {result.diff > 0 ? "+" : ""}
              {inr(result.diff)}
            </b>{" "}
            {result.diff < 0
              ? "(short)"
              : result.diff > 0
                ? "(excess)"
                : "(matches)"}
          </p>
        ) : (
          <p className="mu sm">
            No cash/PayTM entered, so the expected amount (slip + overtime) is
            counted as collected.
          </p>
        )}
      </div>

      {/* MONTH SUMMARY */}
      <div className="card">
        <b>Overall collection · {monthLabel}</b>

        {monthRow("Days recorded", monthSummary.days)}
        {monthRow("In-slips used", monthSummary.n)}
        {monthRow("Slip amount (slips × cost)", inr(monthSummary.amt))}
        {monthRow("+ Overtime", inr(monthSummary.ot))}
        {monthRow("+ Others", inr(monthSummary.extra))}
        {monthRow("Expected (slip + overtime + others)", inr(monthSummary.exp))}
        {monthRow("Cash", inr(monthSummary.cash))}
        {monthRow("PayTM", inr(monthSummary.pt))}
        {monthRow("Short amount", inr(monthSummary.short), "er")}

        {monthSummary.excess > 0 &&
          monthRow("Excess", inr(monthSummary.excess), "ok")}

        {monthRow("Total collected", inr(monthSummary.total), "ok", true)}

        {monthRow(
          "Average per day",
          inr(monthSummary.days ? monthSummary.total / monthSummary.days : 0),
        )}
      </div>

      {/* DAY-WISE COLLECTION */}
      <div className="card" style={{ overflowX: "auto" }}>
        <b>Day-wise collection · {monthLabel}</b>

        <div className="mu sm">Tap a day to open it</div>

        <div style={{ minWidth: "460px" }}>
          <div
  className="dw mu"
  style={{ gridTemplateColumns: "62px 40px repeat(5, minmax(0, 1fr))" }}
>
            <span>Day</span>
            <span>Slips</span>
            <span>Cash</span>
            <span>PayTM</span>
            <span>Others</span>
            <span>Total</span>
            <span>Short</span>
          </div>

          {monthSlips.map((x) => {
            const f = dayFig(x);

            return (
              <div
  className={`dw ${x.date === day ? "sel" : ""}`}
  key={x.id || x.date}
  onClick={() => setDay(x.date)}
  style={{ gridTemplateColumns: "62px 40px repeat(5, minmax(0, 1fr))" }}
>
                <span>
                  {x.date.slice(8)} {weekday(x.date)}
                </span>
                <span>{f.n}</span>
                <span>{inr(f.cash)}</span>
                <span>{inr(f.pt)}</span>
                <span>{inr(f.extra)}</span>
                <b>{inr(f.total)}</b>
                <span style={{ color: f.short ? "var(--er)" : "var(--mu)" }}>
                  {inr(f.short)}
                </span>
              </div>
            );
          })}

          {monthSlips.length > 0 && (
            <div
  className="dw tot"
  style={{ gridTemplateColumns: "62px 40px repeat(5, minmax(0, 1fr))" }}
>
              <span>Total</span>
              <span>{monthSummary.n}</span>
              <span>{inr(monthSummary.cash)}</span>
              <span>{inr(monthSummary.pt)}</span>
              <span>{inr(monthSummary.extra)}</span>
              <b>{inr(monthSummary.total)}</b>
              <span
                style={{
                  color: monthSummary.short ? "var(--er)" : "var(--mu)",
                }}
              >
                {inr(monthSummary.short)}
              </span>
            </div>
          )}

          {monthSlips.length === 0 && (
            <div className="empty">
              No daily collection saved for this month.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Daily;