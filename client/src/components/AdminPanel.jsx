import { useEffect, useMemo, useState } from "react";
import {
  createItem,
  deleteItem,
  fetchAllItems,
  importFacebookItems,
  loginAdmin,
  seedAdmin,
  updateItem,
  updateSettings,
  getSettings
} from "../services/api";

const CATEGORIES = [
  "Clothing",
  "Home & Kitchen",
  "Health & Beauty",
  "Electronics",
  "Baby & Kids",
  "Tools",
  "Other"
];

const STATUSES = ["In Stock", "Sold", "Lost", "Damaged"];

const EMPTY_FORM = {
  uid: "",
  lot: "",
  inv: "",
  date: "",
  desc: "",
  cat: "Other",
  bid: "0",
  cost: "0",
  status: "In Stock",
  hot: false,
  customPrice: "",
  photoUrl: ""
};

function coerceNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildEditable(item) {
  return {
    uid: item.uid,
    lot: item.lot || "",
    inv: item.inv || "",
    date: item.date || "",
    desc: item.desc || "",
    cat: item.cat || "Other",
    bid: String(item.bid ?? 0),
    cost: String(item.cost ?? 0),
    status: item.status || "In Stock",
    hot: Boolean(item.hot),
    customPrice: item.customPrice || "",
    photoUrl: item.photoUrl || ""
  };
}

export default function AdminPanel() {
  const [token, setToken] = useState(localStorage.getItem("ddh_token") || "");
  const [activeTab, setActiveTab] = useState("inventory");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("admin@deenshub.local");
  const [password, setPassword] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");

  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editMap, setEditMap] = useState({});

  const [settingsForm, setSettingsForm] = useState({
    wa: "14385403074",
    fb: "https://m.me/your-fb-page",
    email: ""
  });

  const [facebookRaw, setFacebookRaw] = useState("[");

  const isAuthed = Boolean(token);

  function resetMessage(text) {
    setMessage(text);
    if (text) {
      setTimeout(() => setMessage(""), 2600);
    }
  }

  async function loadAdminData() {
    if (!isAuthed) return;
    setLoading(true);
    try {
      const [allItems, settings] = await Promise.all([fetchAllItems(), getSettings()]);
      setItems(allItems);
      setEditMap(Object.fromEntries(allItems.map((it) => [it.uid, buildEditable(it)])));
      setSettingsForm((prev) => ({ ...prev, ...settings }));
    } catch (err) {
      resetMessage(err?.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, [isAuthed]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const textOk =
        !query ||
        String(it.desc || "").toLowerCase().includes(query.toLowerCase()) ||
        String(it.uid || "").toLowerCase().includes(query.toLowerCase()) ||
        String(it.lot || "").toLowerCase().includes(query.toLowerCase()) ||
        String(it.inv || "").toLowerCase().includes(query.toLowerCase());
      const statusOk = statusFilter === "All" || it.status === statusFilter;
      const catOk = catFilter === "All" || it.cat === catFilter;
      return textOk && statusOk && catOk;
    });
  }, [items, query, statusFilter, catFilter]);

  const stats = useMemo(() => {
    const byStatus = {
      "In Stock": 0,
      Sold: 0,
      Lost: 0,
      Damaged: 0
    };
    const byCategory = {};

    for (const it of items) {
      byStatus[it.status] = (byStatus[it.status] || 0) + 1;
      byCategory[it.cat] = (byCategory[it.cat] || 0) + 1;
    }

    return {
      total: items.length,
      inStock: byStatus["In Stock"] || 0,
      sold: byStatus.Sold || 0,
      hot: items.filter((it) => it.hot).length,
      byStatus,
      byCategory
    };
  }, [items]);

  const topCategories = useMemo(() => {
    return Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [stats.byCategory]);

  async function onLogin(e) {
    e.preventDefault();
    try {
      const data = await loginAdmin(email, password);
      localStorage.setItem("ddh_token", data.token);
      setToken(data.token);
      setPassword("");
      resetMessage("Logged in");
    } catch (err) {
      resetMessage(err?.response?.data?.message || "Login failed");
    }
  }

  async function onSeed() {
    try {
      const out = await seedAdmin();
      resetMessage(out?.message || "Seed done");
    } catch (err) {
      resetMessage(err?.response?.data?.message || "Seed failed");
    }
  }

  function onLogout() {
    localStorage.removeItem("ddh_token");
    setToken("");
    setItems([]);
    setEditMap({});
    resetMessage("Logged out");
  }

  function updateCreateField(key, value) {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitCreate(e) {
    e.preventDefault();
    const payload = {
      ...createForm,
      bid: coerceNumber(createForm.bid),
      cost: coerceNumber(createForm.cost),
      hot: Boolean(createForm.hot)
    };
    try {
      await createItem(payload);
      setCreateForm(EMPTY_FORM);
      resetMessage("Item created");
      await loadAdminData();
      setActiveTab("inventory");
    } catch (err) {
      resetMessage(err?.response?.data?.message || "Create failed");
    }
  }

  function patchEdit(uid, key, value) {
    setEditMap((prev) => ({
      ...prev,
      [uid]: {
        ...prev[uid],
        [key]: value
      }
    }));
  }

  async function saveEdit(uid) {
    const draft = editMap[uid];
    if (!draft) return;
    try {
      await updateItem(uid, {
        lot: draft.lot,
        inv: draft.inv,
        date: draft.date,
        desc: draft.desc,
        cat: draft.cat,
        bid: coerceNumber(draft.bid),
        cost: coerceNumber(draft.cost),
        status: draft.status,
        hot: Boolean(draft.hot),
        customPrice: draft.customPrice,
        photoUrl: draft.photoUrl
      });
      resetMessage("Item updated");
      await loadAdminData();
    } catch (err) {
      resetMessage(err?.response?.data?.message || "Update failed");
    }
  }

  async function removeItem(uid) {
    const ok = window.confirm("Delete this item permanently?");
    if (!ok) return;
    try {
      await deleteItem(uid);
      resetMessage("Item deleted");
      await loadAdminData();
    } catch (err) {
      resetMessage(err?.response?.data?.message || "Delete failed");
    }
  }

  async function saveSettings(e) {
    e.preventDefault();
    try {
      await updateSettings(settingsForm);
      resetMessage("Settings saved");
    } catch (err) {
      resetMessage(err?.response?.data?.message || "Settings failed");
    }
  }

  async function submitFacebookImport(e) {
    e.preventDefault();
    try {
      const parsed = JSON.parse(facebookRaw);
      if (!Array.isArray(parsed)) {
        resetMessage("Import JSON must be an array");
        return;
      }
      const out = await importFacebookItems(parsed);
      resetMessage(out?.message || `Imported ${parsed.length} rows`);
      await loadAdminData();
      setActiveTab("inventory");
    } catch (err) {
      resetMessage(err?.response?.data?.message || err?.message || "Import failed");
    }
  }

  const tabs = [
    { key: "inventory", label: "Inventory" },
    { key: "create", label: "Add Item" },
    { key: "insights", label: "Stock Tracker" },
    { key: "settings", label: "Settings" },
    { key: "import", label: "Facebook Import" }
  ];

  return (
    <div className="admin-page wrap section-gap">
      <div className="admin-header">
        <div>
          <h1>Admin Control Center</h1>
          <p className="muted">Secure item management, imports, and stock insights</p>
        </div>
        {isAuthed ? (
          <button className="btn btn-navy" type="button" onClick={onLogout}>
            Logout
          </button>
        ) : null}
      </div>

      {!isAuthed ? (
        <section className="panel admin-auth-panel">
          <h2>Admin Login</h2>
          <p className="muted">Sign in to manage inventory, settings, and imports.</p>

          <form className="admin-login" onSubmit={onLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            <button className="btn btn-navy" type="submit">
              Login
            </button>
            <button className="small-btn" type="button" onClick={onSeed}>
              Seed default admin
            </button>
          </form>
          {message ? <p className="muted">{message}</p> : null}
        </section>
      ) : (
        <>
          <section className="admin-kpi-grid">
            <article className="panel">
              <p>Total items</p>
              <strong>{stats.total}</strong>
            </article>
            <article className="panel">
              <p>In stock</p>
              <strong>{stats.inStock}</strong>
            </article>
            <article className="panel">
              <p>Sold</p>
              <strong>{stats.sold}</strong>
            </article>
            <article className="panel">
              <p>Hot deals</p>
              <strong>{stats.hot}</strong>
            </article>
          </section>

          <section className="panel">
            <div className="admin-tab-row">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={activeTab === tab.key ? "chip active" : "chip"}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "inventory" ? (
              <>
                <div className="admin-toolbar">
                  <input
                    type="search"
                    placeholder="Search by uid, lot, inv, description"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />

                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">All statuses</option>
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>

                  <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                    <option value="All">All categories</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <button className="small-btn" type="button" onClick={loadAdminData}>
                    Refresh
                  </button>
                </div>

                <div className="admin-list">
                  {loading ? <p className="muted">Loading...</p> : null}
                  {!loading && !filteredItems.length ? <p className="muted">No items found.</p> : null}

                  {filteredItems.map((it) => {
                    const draft = editMap[it.uid] || buildEditable(it);
                    return (
                      <article key={it.uid} className="panel admin-row admin-row-edit">
                        <div className="admin-row-main">
                          <div className="row-topline">
                            <h4>{it.uid}</h4>
                            <span className="pill">{draft.status}</span>
                            <span className="pill">{draft.cat}</span>
                          </div>

                          <textarea
                            value={draft.desc}
                            onChange={(e) => patchEdit(it.uid, "desc", e.target.value)}
                            placeholder="Description"
                          />

                          <div className="crud-form edit-grid">
                            <input
                              value={draft.lot}
                              onChange={(e) => patchEdit(it.uid, "lot", e.target.value)}
                              placeholder="Lot"
                            />
                            <input
                              value={draft.inv}
                              onChange={(e) => patchEdit(it.uid, "inv", e.target.value)}
                              placeholder="Invoice"
                            />
                            <input
                              value={draft.date}
                              onChange={(e) => patchEdit(it.uid, "date", e.target.value)}
                              placeholder="Date"
                            />
                            <select value={draft.cat} onChange={(e) => patchEdit(it.uid, "cat", e.target.value)}>
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>

                            <input
                              value={draft.bid}
                              onChange={(e) => patchEdit(it.uid, "bid", e.target.value)}
                              placeholder="Bid"
                            />
                            <input
                              value={draft.cost}
                              onChange={(e) => patchEdit(it.uid, "cost", e.target.value)}
                              placeholder="Cost"
                            />
                            <input
                              value={draft.customPrice}
                              onChange={(e) => patchEdit(it.uid, "customPrice", e.target.value)}
                              placeholder="Custom price"
                            />
                            <select value={draft.status} onChange={(e) => patchEdit(it.uid, "status", e.target.value)}>
                              {STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>

                          <input
                            value={draft.photoUrl}
                            onChange={(e) => patchEdit(it.uid, "photoUrl", e.target.value)}
                            placeholder="Photo URL"
                          />

                          {draft.photoUrl ? <img className="row-photo" src={draft.photoUrl} alt="item" /> : null}
                        </div>

                        <div className="admin-row-actions">
                          <label className="hot-toggle">
                            <input
                              type="checkbox"
                              checked={Boolean(draft.hot)}
                              onChange={(e) => patchEdit(it.uid, "hot", e.target.checked)}
                            />
                            Hot deal
                          </label>
                          <button className="small-btn strong" type="button" onClick={() => saveEdit(it.uid)}>
                            Save
                          </button>
                          <button className="small-btn" type="button" onClick={() => removeItem(it.uid)}>
                            Delete
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            ) : null}

            {activeTab === "create" ? (
              <form className="crud-form" onSubmit={submitCreate}>
                <input value={createForm.uid} onChange={(e) => updateCreateField("uid", e.target.value)} placeholder="uid" required />
                <input value={createForm.lot} onChange={(e) => updateCreateField("lot", e.target.value)} placeholder="lot" required />
                <input value={createForm.inv} onChange={(e) => updateCreateField("inv", e.target.value)} placeholder="invoice" required />
                <input value={createForm.date} onChange={(e) => updateCreateField("date", e.target.value)} placeholder="date" required />
                <select value={createForm.cat} onChange={(e) => updateCreateField("cat", e.target.value)}>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <select value={createForm.status} onChange={(e) => updateCreateField("status", e.target.value)}>
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <input value={createForm.bid} onChange={(e) => updateCreateField("bid", e.target.value)} placeholder="bid" />
                <input value={createForm.cost} onChange={(e) => updateCreateField("cost", e.target.value)} placeholder="cost" />
                <input
                  value={createForm.customPrice}
                  onChange={(e) => updateCreateField("customPrice", e.target.value)}
                  placeholder="custom price"
                />
                <input value={createForm.photoUrl} onChange={(e) => updateCreateField("photoUrl", e.target.value)} placeholder="photo URL" />
                <label className="hot-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(createForm.hot)}
                    onChange={(e) => updateCreateField("hot", e.target.checked)}
                  />
                  Hot deal
                </label>
                <textarea
                  value={createForm.desc}
                  onChange={(e) => updateCreateField("desc", e.target.value)}
                  placeholder="description"
                  required
                />
                <button className="btn btn-navy" type="submit">
                  Create Item
                </button>
              </form>
            ) : null}

            {activeTab === "insights" ? (
              <section className="chart-panel">
                <h2>Stock Tracker Graph</h2>
                <div className="chart-grid">
                  <article>
                    <h3>By Status</h3>
                    <div className="bar-list">
                      {Object.entries(stats.byStatus).map(([label, count]) => {
                        const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                        return (
                          <div key={label} className="bar-row">
                            <span>{label}</span>
                            <div className="bar-wrap">
                              <div className="bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <span>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </article>

                  <article>
                    <h3>Top Categories</h3>
                    <div className="bar-list">
                      {topCategories.map(([label, count]) => {
                        const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                        return (
                          <div key={label} className="bar-row">
                            <span>{label}</span>
                            <div className="bar-wrap">
                              <div className="bar-fill alt" style={{ width: `${pct}%` }} />
                            </div>
                            <span>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                </div>
              </section>
            ) : null}

            {activeTab === "settings" ? (
              <form className="crud-form settings-grid" onSubmit={saveSettings}>
                <input
                  value={settingsForm.wa || ""}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, wa: e.target.value }))}
                  placeholder="WhatsApp number"
                />
                <input
                  value={settingsForm.fb || ""}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, fb: e.target.value }))}
                  placeholder="Facebook messenger URL"
                />
                <input
                  value={settingsForm.email || ""}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Email"
                />
                <button className="btn btn-navy" type="submit">
                  Save Settings
                </button>
              </form>
            ) : null}

            {activeTab === "import" ? (
              <form onSubmit={submitFacebookImport}>
                <p className="muted">Paste Facebook Marketplace export JSON array and import/update in bulk.</p>
                <textarea
                  className="fb-import"
                  value={facebookRaw}
                  onChange={(e) => setFacebookRaw(e.target.value)}
                  placeholder='[{"id":"123","title":"Item name","price":25,"category":"Electronics"}]'
                />
                <div className="admin-toolbar">
                  <button className="btn btn-navy" type="submit">
                    Import from Facebook
                  </button>
                </div>
              </form>
            ) : null}
          </section>

          {message ? <p className="muted">{message}</p> : null}
        </>
      )}
    </div>
  );
}
