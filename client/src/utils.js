export const CAPACITY = 40; 

export const currentMonth = () => new Date().toISOString().slice(0, 7); 

export const today = () => new Date().toISOString().slice(0, 10); 

export const monthIndex = m => { const [y, n] = m.split('-').map(Number); return y * 12 + n - 1 }; 

export const shiftMonth = (m, n) => { const i = monthIndex(m) + n; return `${Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, '0')}` }; 
    
export const monthLabel = m => new Date(`${m}-01T00:00:00`).toLocaleString('en-IN', { month: 'long', year: 'numeric' }); 

export const inr = n => `₹${Math.round(Number(n || 0)).toLocaleString('en-IN')}`; 

export const active = (t, m) => monthIndex(m) >= monthIndex(t.start) && (!t.end || monthIndex(m) <= monthIndex(t.end)); 

export const sum = a => a.reduce((s, x) => s + Number(x.amount || 0), 0); 

export const pays = (ps, t, k) => ps.filter(p => p.tenantId === t._id && p.kind === k); 

export const paid = (ps, t, m) => sum(pays(ps, t, 'rent').filter(p => p.month === m)); 

export const pending = (ps, t, u) => { const last = t.end && monthIndex(t.end) < monthIndex(u) ? t.end : u; return t.rent * Math.max(0, monthIndex(last) - monthIndex(t.start) + 1) - sum(pays(ps, t, 'rent').filter(p => monthIndex(p.month) <= monthIndex(u))) }; 

export const deposit = (ps, t) => sum(pays(ps, t, 'deposit')) - sum(pays(ps, t, 'refund')); 

export const late = (ps, s, t) => { if (!s.lateFee) return 0; 
    
const last = t.end && monthIndex(t.end) < monthIndex(currentMonth()) ? t.end : currentMonth(); 

let count = 0; 

for (let m = t.start; monthIndex(m) <= monthIndex(last); m = shiftMonth(m, 1)) { const due = `${m}-${String(s.grace).padStart(2, '0')}`; 

if (today() > due && sum(pays(ps, t, 'rent').filter(p => p.month === m && p.date <= due)) < t.rent) count++ } return Math.max(0, count * s.lateFee - sum(pays(ps, t, 'latefee'))) };
