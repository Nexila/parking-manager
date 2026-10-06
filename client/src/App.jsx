import React, { useEffect as reactUseEffect, useMemo, useState } from "react";

import { api } from "./api";
import ReminderForm from "./components/ReminderForm";
import {
  CAPACITY,
  currentMonth,
  today,
  shiftMonth,
  active,
  paid,
  pending,
  deposit,
  late,
  sum,
  inr,
} from "./utils";

import Monthly from "./components/Monthly";
import Tenants from "./components/Tenants";
import Year from "./components/Year";
import { TenantForm, PaymentForm, Detail, Settings } from "./components/Modals";

const useEffect = (effect, dependencies) =>
  reactUseEffect(() => {
    effect();
  }, dependencies);

function App() {
  const [data, setData] = useState({
    tenants: [],
    payments: [],
    settings: {
      lateFee: 0,
      grace: 5,
      theme: "light",
    },
  });

  const [tab, setTab] = useState("home");
  const [month, setMonth] = useState(currentMonth());
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  const reload = () => {
    api
      .load()
      .then(([tenants, payments, settings]) => {
        setData({
          tenants,
          payments,
          settings,
        });
      })
      .catch((e) => setError(e.message));
  };

  useEffect(reload, []);

  // --------------------------------------------------
  // THEME
  // --------------------------------------------------

  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.theme;
  }, [data.settings.theme]);

  const { tenants, payments, settings } = data;

  // --------------------------------------------------
  // LIVE TENANTS
  // --------------------------------------------------

  const live = useMemo(
    () =>
      tenants.filter((t) => active(t, month)).sort((a, b) => a.slot - b.slot),
    [tenants, month],
  );

  // --------------------------------------------------
  // SAVE TENANT
  // --------------------------------------------------

  const saveTenant = async (form) => {
    try {
      const saved = form._id
        ? await api.updateTenant(form._id, form)
        : await api.createTenant(form);

      // Initial deposit
      if (!form._id && form.deposit > 0) {
        await api.createPayment({
          tenantId: saved._id,
          kind: "deposit",
          amount: form.deposit,
          month: form.start,
          date: today(),
          note: "Initial deposit",
        });
      }

      reload();
    } catch (e) {
      alert(e.message);
    }
  };

  // --------------------------------------------------
  // SAVE PAYMENT
  // --------------------------------------------------

  const savePayment = async (form) => {
    try {
      await api.createPayment(form);
      reload();
    } catch (e) {
      alert(e.message);
    }
  };

  // --------------------------------------------------
  // WHATSAPP REMINDER
  // --------------------------------------------------

  const remind = (tenant) => {
    const due =
      Math.max(0, pending(payments, tenant, currentMonth())) +
      late(payments, settings, tenant);

    const message = `Hello ${tenant.name}, your parking payment due is ${inr(
      due,
    )}. Please pay at your earliest convenience.`;

    navigator.clipboard?.writeText(message);

    if (tenant.phone) {
      window.open(
        `https://wa.me/${tenant.phone.replace(
          /\D/g,
          "",
        )}?text=${encodeURIComponent(message)}`,
        "_blank",
      );
    } else {
      alert("Reminder copied. Add a phone number to open WhatsApp.");
    }
  };

  // --------------------------------------------------
  // RECEIPT
  // --------------------------------------------------

  const receipt = (payment) => {
    window.open("", "_blank").document.write(
      `<h1>Parking Manager</h1>
        <p>Receipt: ${payment.kind}</p>
        <p>Amount: ${inr(payment.amount)}</p>
        <p>Date: ${payment.date}</p>
        <script>print()<\/script>`,
    );
  };

  // --------------------------------------------------
  // BACKUP
  // --------------------------------------------------

  const backup = async () => {
    const file = new Blob([JSON.stringify(await api.backup(), null, 2)], {
      type: "application/json",
    });

    const a = document.createElement("a");

    a.href = URL.createObjectURL(file);
    a.download = `parking-backup-${today()}.json`;

    a.click();
  };

  // --------------------------------------------------
  // RESTORE
  // --------------------------------------------------

  const restore = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    file.text().then(async (text) => {
      try {
        if (confirm("Replace ALL current data with this backup?")) {
          await api.restore(JSON.parse(text));

          setModal(null);

          reload();
        }
      } catch (err) {
        alert(err.message || "Not a valid backup file.");
      }
    });
  };

  // --------------------------------------------------
  // COMMON MONTHLY VALUES
  // --------------------------------------------------

  const occupied = live.length;

  const collected = sum(
    live.map((tenant) => ({
      amount: paid(payments, tenant, month),
    })),
  );

  const expected = sum(
    live.map((tenant) => ({
      amount: tenant.rent,
    })),
  );

  const totalDue = sum(
    tenants.map((tenant) => ({
      amount: Math.max(0, pending(payments, tenant, month)),
    })),
  );

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  const openReminder = (tenant) => {
    setModal({
      type: "reminder",
      tenant,
    });
  };
  return (
    <>
      <main>
        {error && <div className="note">{error}</div>}

        {/* MONTHLY TAB */}
        {tab === "home" && (
          <Monthly
            tenants={tenants}
            payments={payments}
            settings={settings}
            live={live}
            month={month}
            occupied={occupied}
            collected={collected}
            expected={expected}
            totalDue={totalDue}
            setMonth={setMonth}
            setModal={setModal}
            openReminder={openReminder}
          />
        )}

        {/* TENANTS TAB */}
        {tab === "tenants" && (
          <Tenants
            tenants={tenants}
            payments={payments}
            settings={settings}
            live={live}
            month={month}
            occupied={occupied}
            setModal={setModal}
            remind={remind}
          />
        )}

        {/* YEAR TAB */}
        {tab === "year" && (
          <Year
            tenants={tenants}
            payments={payments}
            year={Number(month.slice(0, 4))}
            onYear={(newYear) => {
              const currentMonthNumber = month.slice(5, 7);

              setMonth(`${newYear}-${currentMonthNumber}`);
            }}
          />
        )}
      </main>

      {/* NAVIGATION */}
      <nav>
        {[
          ["home", "Monthly"],
          ["tenants", "Tenants"],
          ["year", "Year"],
        ].map(([id, label]) => (
          <button
            className={tab === id ? "on" : ""}
            onClick={() => setTab(id)}
            key={id}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* NEW TENANT */}
      {modal?.type === "tenant" && (
        <TenantForm
          tenants={tenants}
          month={month}
          onClose={() => setModal(null)}
          onSave={saveTenant}
        />
      )}

      {/* PAYMENT */}
      {modal?.type === "pay" && (
        <PaymentForm
          {...modal}
          payments={payments}
          settings={settings}
          month={month}
          onClose={() => setModal(null)}
          onSave={savePayment}
        />
      )}

      {/* DETAIL */}
      {modal?.type === "detail" && (
        <Detail
          tenant={modal.tenant}
          payments={payments}
          settings={settings}
          onClose={() => setModal(null)}
          onPay={() =>
            setModal({
              type: "pay",
              tenant: modal.tenant,
            })
          }
          onEdit={() =>
            setModal({
              type: "edit",
              tenant: modal.tenant,
            })
          }
          remind={remind}
          receipt={receipt}
          reload={reload}
        />
      )}

      {/* EDIT TENANT */}
      {modal?.type === "edit" && (
        <TenantForm
          tenant={modal.tenant}
          tenants={tenants}
          month={month}
          onClose={() => setModal(null)}
          onSave={saveTenant}
        />
      )}

      {/* SETTINGS */}
      {modal?.type === "settings" && (
        <Settings
          settings={settings}
          onClose={() => setModal(null)}
          backup={backup}
          restore={restore}
          save={async (settingsData) => {
            await api.saveSettings(settingsData);

            reload();

            setModal(null);
          }}
        />
      )}

      {modal?.type === "reminder" && (
        <ReminderForm
          tenant={modal.tenant}
          payments={payments}
          settings={settings}
          onClose={() => setModal(null)}
        />
      )}

    
    </>
  );
}

export default App;
