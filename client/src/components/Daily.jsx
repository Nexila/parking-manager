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
  const c = x.cash || 0;
  const p = x.paytm || 0;
  const o = x.over || 0;

  const exp = amt + o;
  const none = !c && !p;
  const col = none ? exp : c + p;

  return {
    n,
    amt,
    ot: o,
    exp,
    cash: none ? exp : c,
    pt: p,
    total: col,
    short: none ? 0 : Math.max(0, exp - col),
    diff: none ? 0 : col - exp,
    entered: !none,
  };
}

function Daily({ slips = [], settings = {}, day, setDay, onSave, onDelete }) {
  const savedSlip = slips.find((x) => x.date === day);

  const [form, setForm] = useState({
    from: snap(nowDT()),
    to: snap(nowDT()),
    start: "",
    end: "",
    rate: settings.slipRate || 20,
    over: "",
    cash: "",
    paytm: "",
  });

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
      });
    } else {
      setForm({
        from: day + "T00:00",
        to: day + "T23:45",
        start: "",
        end: "",
        rate: settings.slipRate || 20,
        over: "",
        cash: "",
        paytm: "",
      });
    }
  }, [day, slips, settings.slipRate]);

  // Same as original dayFig()
  const result = dayFig({
    ...form,
    start: form.start === "" ? null : Number(form.start),
    end: form.end === "" ? null : Number(form.end),
    rate: Number(form.rate) || 0,
    over: Number(form.over) || 0,
    cash: Number(form.cash) || 0,
    paytm: Number(form.paytm) || 0,
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

  return (
    <div className="daily-page">
      <h2>Daily collection</h2>

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
              from: date + "T" + prev.from.split("T")[1],
              to: date + "T" + prev.to.split("T")[1],
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
              from: date + "T" + prev.from.split("T")[1],
              to: date + "T" + prev.to.split("T")[1],
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
          {result.ot > 0 && (
            <>
              {" "}
              + overtime {inr(result.ot)} = <b>{inr(result.exp)}</b>
            </>
          )}
        </div>

        {input("over", "Overtime collection (₹)")}

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
          <div className="m">Expected (slip + overtime)</div>
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
    </div>
  );
}

export default Daily;
