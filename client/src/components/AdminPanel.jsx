import { useEffect, useMemo, useState } from "react";
import { fetchAllItems, loginAdmin, seedAdmin, updateItem } from "../services/api";

const defaultCreds = {
  email: "admin@deenshub.local",
  password: "deens2026"
};

export default function AdminPanel() {
  const [email, setEmail] = useState(defaultCreds.email);
  const [password, setPassword] = useState(defaultCreds.password);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Not logged in");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("ddh_token");

  async function loadItems() {
    setLoading(true);
    try {
      const data = await fetchAllItems();
      setItems(data);
      setStatus(`Loaded ${data.length} items`);
    } catch (err) {
      setStatus(err?.response?.data?.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (!search) return true;
      const value = search.toLowerCase();
      return (
        String(it.desc || "").toLowerCase().includes(value) ||
        String(it.lot || "").toLowerCase().includes(value) ||
        String(it.uid || "").toLowerCase().includes(value)
      );
    });
  }, [items, search]);

  async function handleSeed() {
    try {
      const data = await seedAdmin();
      setStatus(data.message || "Seeded");
    } catch (err) {
      setStatus(err?.response?.data?.message || "Seed failed");
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const data = await loginAdmin(email, password);
      localStorage.setItem("ddh_token", data.token);
      setStatus("Logged in");
      await loadItems();
    } catch (err) {
      setStatus(err?.response?.data?.message || "Login failed");
    }
  }

  async function handleToggleHot(item) {
    try {
      const updated = await updateItem(item.uid, { hot: !item.hot });
      setItems((prev) => prev.map((it) => (it.uid === item.uid ? updated : it)));
    } catch (err) {
      setStatus(err?.response?.data?.message || "Update failed");
    }
  }

  async function handlePriceSave(uid, customPrice) {
    try {
      const updated = await updateItem(uid, { customPrice });
      setItems((prev) => prev.map((it) => (it.uid === uid ? updated : it)));
      setStatus("Price updated");
    } catch (err) {
      setStatus(err?.response?.data?.message || "Price update failed");
    }
  }

  return (
    <div className="wrap section-gap admin-page">
      <h1>Admin Dashboard (MERN)</h1>
      <p className="muted">{status}</p>

      {!token && (
        <form className="admin-login" onSubmit={handleLogin}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
          />
          <button type="submit" className="btn btn-wa">
            Login
          </button>
          <button type="button" className="btn btn-fb" onClick={handleSeed}>
            Seed Default Admin
          </button>
        </form>
      )}

      {token && (
        <>
          <div className="admin-toolbar">
            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item by lot/uid/description"
            />
            <button className="btn btn-fb" onClick={loadItems} disabled={loading}>
              Refresh
            </button>
            <button
              className="btn"
              onClick={() => {
                localStorage.removeItem("ddh_token");
                location.reload();
              }}
            >
              Logout
            </button>
          </div>

          <div className="admin-list">
            {filtered.slice(0, 120).map((item) => (
              <AdminRow
                key={item.uid}
                item={item}
                onToggleHot={() => handleToggleHot(item)}
                onSavePrice={handlePriceSave}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AdminRow({ item, onToggleHot, onSavePrice }) {
  const [price, setPrice] = useState(item.customPrice || "");

  return (
    <div className="admin-row">
      <div>
        <h4>{item.desc}</h4>
        <p className="muted">
          {item.uid} - {item.cat}
        </p>
      </div>
      <label className="hot-toggle">
        <input type="checkbox" checked={!!item.hot} onChange={onToggleHot} /> Hot
      </label>
      <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Custom price, ex: $45" />
      <button className="small-btn" onClick={() => onSavePrice(item.uid, price)}>
        Save
      </button>
    </div>
  );
}
