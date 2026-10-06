import React, { useState } from "react";

import {
  inr,
  pending,
  late,
  currentMonth,
} from "../utils";

import { Modal } from "./Modals";

function ReminderForm({
  tenant,
  payments,
  settings,
  onClose,
}) {
  const cur = currentMonth();

  const p = Math.max(
    0,
    pending(payments, tenant, cur)
  );

  const l = late(
    payments,
    settings,
    tenant
  );

  const [curMsg, setCurMsg] = useState(
    `Hello ${tenant.name}, gentle reminder: parking rent for slot ${tenant.slot}${
      tenant.car ? ` (${tenant.car})` : ""
    } is pending. Rent due: ${inr(p)}` +
      (l ? `, late fee: ${inr(l)}` : "") +
      `. Total: ${inr(
        p + l
      )}. Please pay at the earliest. Thank you!`
  );

  function phone(t) {
    let d = (t.phone || "").replace(/\D/g, "");

    if (d.length === 10) {
      d = "91" + d;
    }

    return d;
  }

  function sendMsg(kind) {
    const d = phone(tenant);

    if (!d) {
      alert(
        "Add a phone number for this tenant first (Edit)."
      );
      return;
    }

    const url =
      kind === "wa"
        ? `https://wa.me/${d}?text=${encodeURIComponent(curMsg)}`
        : `sms:+${d}?body=${encodeURIComponent(curMsg)}`;

    window.open(url, "_blank");
  }

  function copyMsg() {
    navigator.clipboard
      .writeText(curMsg)
      .then(() => {
        alert("Copied");
      })
      .catch(() => {
        alert("Copy not available");
      });
  }

  return (
    <Modal onClose={onClose}>
      <h1>Payment reminder</h1>

      <div className="mu sm">
        {tenant.name} ·{" "}
        {tenant.phone || "no phone saved"}
      </div>

      <label>
        Message (editable)
      </label>

      <textarea
        rows="6"
        value={curMsg}
        onChange={(e) => setCurMsg(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          font: "inherit",
          padding: "10px",
          borderRadius: "10px",
          border: "1px solid var(--bd)",
          background: "var(--bg)",
          color: "var(--tx)",
          resize: "vertical",
        }}
      />

      <div
        className="two pb"
        style={{
          marginTop: "12px",
        }}
      >
        <button
          className="pri"
          onClick={() => sendMsg("wa")}
        >
          WhatsApp
        </button>

        <button
          onClick={() => sendMsg("sms")}
        >
          SMS
        </button>

        <button onClick={copyMsg}>
          Copy text
        </button>

        <button onClick={onClose}>
          Back
        </button>
      </div>
    </Modal>
  );
}

export default ReminderForm;