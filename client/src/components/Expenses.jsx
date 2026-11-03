import React from "react";
import "../styles/Expenses.css";
function Expenses({
  expenses = [],
  income,
  month,
  setMonth,
  setModal,
  onDelete,
}) {
  // Get expenses for selected month
  const monthlyExpenses = expenses.filter((e) => e.date.slice(0, 7) === month);

  // Calculate monthly expense total
  const monthlyTotal = monthlyExpenses.reduce(
    (total, e) => total + Number(e.amount),
    0,
  );

  // Calculate net amount
  const net = Number(income) - monthlyTotal;

  // Change month
  const changeMonth = (value) => {
    const date = new Date(`${month}-01T00:00:00`);
    date.setMonth(date.getMonth() + value);

    const newMonth =
      date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");

    setMonth(newMonth);
  };

  // Format money
  const formatMoney = (amount) => "₹" + Number(amount).toLocaleString("en-IN");

  // Month name
  const monthName = new Date(`${month}-01T00:00:00`).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const categoryTotals = {};

  monthlyExpenses.forEach((expense) => {
    categoryTotals[expense.category] =
      (categoryTotals[expense.category] || 0) + Number(expense.amount);
  });
  return (
    <div className="expenses-page">
      <h2>Expenses</h2>

      {/* MONTH NAVIGATION */}
      <div className="expense-month">
        <button onClick={() => changeMonth(-1)}>‹</button>

        <h3>{monthName}</h3>

        <button onClick={() => changeMonth(1)}>›</button>
      </div>

      {/* INCOME AND EXPENSES */}
      <div className="expense-summary">
        <div className="expense-card">
          <p>Income (all)</p>
          <h3 className="expense-income">{formatMoney(income)}</h3>
        </div>

        <div className="expense-card">
          <p>Expenses</p>
          <h3 className="expense-amount">{formatMoney(monthlyTotal)}</h3>
        </div>
      </div>

      {/* NET AMOUNT */}
      <div className="expense-card expense-net-card">
        <div className="expense-net-row">
          <span>Net for the month</span>

          <b className={net >= 0 ? "expense-income" : "expense-amount"}>
            {formatMoney(net)}
          </b>
        </div>

        <p>Income = rent + late fees + daily collection, by date received.</p>
      </div>

      {/* BY ITEM */}
      <div className="expense-card">
        <p>By item</p>

        {Object.entries(categoryTotals).map(([category, amount]) => (
          <div className="expense-category-row" key={category}>
            <span>{category}</span>
            <b>{formatMoney(amount)}</b>
          </div>
        ))}
      </div>
      {/* EXPENSE ENTRIES */}
      <div className="expense-card expense-entries">
        <p>Entries</p>

        {monthlyExpenses.length === 0 ? (
          <div className="expense-empty">
            No expenses this month.
            <br />
            Tap “Add expense”.
          </div>
        ) : (
          monthlyExpenses
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((expense) => (
              <div className="item" key={expense._id}>
                <div className="m">
                  <b>{expense.category}</b>

                  <div className="mu sm">
                    {expense.date.replace("T", " ")}
                    {expense.note && ` · ${expense.note}`}
                  </div>
                </div>

                <b className="expense-amount">{formatMoney(expense.amount)}</b>

                <button
                  className="dng"
                  onClick={() => {
                    if (window.confirm("Delete this expense?")) {
                      onDelete(expense._id);
                    }
                  }}
                >
                  ✕
                </button>
              </div>
            ))
        )}
      </div>

      {/* FLOATING ADD BUTTON */}
      <button
        className="expense-fab"
        onClick={() => setModal({ type: "expense" })}
      >
        + Add expense
      </button>
    </div>
  );
}

export default Expenses;
