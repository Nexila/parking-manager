
import React, { useState } from "react";
import { today } from "../utils";
import "../styles/Expenses.css"
function getDateTime() {
  const now = new Date();

  const date = today();

  const time =
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0");

  return `${date}T${time}`;
}

function ExpenseForm({ onClose, onSave }) {
  const [items, setItems] = useState([
    "Security Salary",
    "Security Daily Batta",
    "EB Payment",
    "Others",
  ]);

  const [newItem, setNewItem] = useState("");

  const [form, setForm] = useState({
    category: "Security Salary",
    amount: "",
    date: getDateTime(),
    note: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };
const addItem = () => {
  const value = newItem.trim();

  if (!value) {
    alert("Enter item name");
    return;
  }

  if (items.some((item) => item.toLowerCase() === value.toLowerCase())) {
    alert("Item already exists");
    return;
  }

  setItems((prev) => [...prev, value]);

  setForm((prev) => ({
    ...prev,
    category: value,
  }));

  setNewItem("");
};

const handleSubmit = (e) => {
  e.preventDefault();

  if (!form.amount || Number(form.amount) <= 0) {
    alert("Enter a valid amount");
    return;
  }

  onSave({
    ...form,
    amount: Number(form.amount),
  });
};

  return (
    <div className="expense-overlay">

      <form className="expense-sheet" onSubmit={handleSubmit}>

        <h2>Add expense</h2>

        <label>Item</label>

        <select
          name="category"
          value={form.category}
          onChange={handleChange}
        >
          {items.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div className="expense-new-item">
          <input
            type="text"
            placeholder="New item name"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />

          <button type="button" onClick={addItem}>
            Add item
          </button>
        </div>

        <div className="expense-form-row">

          <div>
            <label>Amount (₹)</label>

            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          <div>
            <label>Date</label>

            <input
              type="datetime-local"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>

        </div>

        <label>Note (optional)</label>

        <input
          type="text"
          name="note"
          value={form.note}
          onChange={handleChange}
        />

        <div className="expense-form-actions">

          <button type="button" onClick={onClose}>
            Cancel
          </button>

          <button type="submit" className="pri">
            Save
          </button>

        </div>

      </form>

    </div>
  );
}

export default ExpenseForm;
