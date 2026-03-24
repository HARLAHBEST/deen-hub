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
            <div className="field-group">
              <label className="field-label" htmlFor="admin-email">
                Admin email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
              <small className="field-help">Use the email for your admin account.</small>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <small className="field-help">Your secure admin password.</small>
            </div>
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
                <div className="field-group">
                  <label className="field-label" htmlFor="create-uid">
                    Item UID
                  </label>
                  <input
                    id="create-uid"
                    value={createForm.uid}
                    onChange={(e) => updateCreateField("uid", e.target.value)}
                    placeholder="Unique item ID"
                    required
                  />
                  <small className="field-help">Unique identifier used to track this item.</small>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="create-lot">
                    Lot number
                  </label>
                  <input
                    id="create-lot"
                    value={createForm.lot}
                    onChange={(e) => updateCreateField("lot", e.target.value)}
                    placeholder="Lot reference"
                    required
                  />
                  <small className="field-help">Batch or lot reference from supplier.</small>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="create-invoice">
                    Invoice number
                  </label>
                  <input
                    id="create-invoice"
                    value={createForm.inv}
                    onChange={(e) => updateCreateField("inv", e.target.value)}
                    placeholder="Invoice reference"
                    required
                  />
                  <small className="field-help">Invoice document number for purchase records.</small>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="create-date">
                    Purchase date
                  </label>
                  <input
                    id="create-date"
                    value={createForm.date}
                    onChange={(e) => updateCreateField("date", e.target.value)}
                    placeholder="YYYY-MM-DD"
                    required
                  />
                  <small className="field-help">Date when the item was acquired.</small>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="create-category">
                    Category
                  </label>
                  <select id="create-category" value={createForm.cat} onChange={(e) => updateCreateField("cat", e.target.value)}>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <small className="field-help">Product type shown in the storefront filter.</small>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="create-status">
                    Status
                  </label>
                  <select id="create-status" value={createForm.status} onChange={(e) => updateCreateField("status", e.target.value)}>
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <small className="field-help">Current stock lifecycle state.</small>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="create-bid">
                    Bid amount
                  </label>
                  <input
                    id="create-bid"
                    value={createForm.bid}
                    onChange={(e) => updateCreateField("bid", e.target.value)}
                    placeholder="0.00"
                  />
                  <small className="field-help">Auction bid or initial offer value.</small>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="create-cost">
                    Cost
                  </label>
                  <input
                    id="create-cost"
                    value={createForm.cost}
                    onChange={(e) => updateCreateField("cost", e.target.value)}
                    placeholder="0.00"
                  />
                  <small className="field-help">Internal purchase cost before markup.</small>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="create-custom-price">
                    Custom price
                  </label>
                  <input
                    id="create-custom-price"
                    value={createForm.customPrice}
                    onChange={(e) => updateCreateField("customPrice", e.target.value)}
                    placeholder="Override selling price"
                  />
                  <small className="field-help">Optional manual selling price override.</small>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="create-photo-url">
                    Photo URL
                  </label>
                  <input
                    id="create-photo-url"
                    value={createForm.photoUrl}
                    onChange={(e) => updateCreateField("photoUrl", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <small className="field-help">Public image link used in listings.</small>
                </div>
                <label className="hot-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(createForm.hot)}
                    onChange={(e) => updateCreateField("hot", e.target.checked)}
                  />
                  Hot deal
                </label>
                <div className="field-group field-group-wide">
                  <label className="field-label" htmlFor="create-description">
                    Description
                  </label>
                  <textarea
                    id="create-description"
                    value={createForm.desc}
                    onChange={(e) => updateCreateField("desc", e.target.value)}
                    placeholder="Write a clear item description for customers"
                    required
                  />
                  <small className="field-help">Shown to customers on product cards and details.</small>
                </div>
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
                <div className="field-group">
                  <label className="field-label" htmlFor="settings-wa">
                    WhatsApp number
                  </label>
                  <input
                    id="settings-wa"
                    value={settingsForm.wa || ""}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, wa: e.target.value }))}
                    placeholder="+1 555 000 0000"
                  />
                  <small className="field-help">Displayed as the quick WhatsApp contact button.</small>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="settings-fb">
                    Facebook Messenger URL
                  </label>
                  <input
                    id="settings-fb"
                    value={settingsForm.fb || ""}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, fb: e.target.value }))}
                    placeholder="https://m.me/your-page"
                  />
                  <small className="field-help">Link used for Messenger contact actions.</small>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="settings-email">
                    Support email
                  </label>
                  <input
                    id="settings-email"
                    value={settingsForm.email || ""}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="support@example.com"
                  />
                  <small className="field-help">Public email shown to customers.</small>
                </div>
                <button className="btn btn-navy" type="submit">
                  Save Settings
                </button>
              </form>
            ) : null}

            {activeTab === "import" ? (
              <form onSubmit={submitFacebookImport}>
                <p className="muted">Paste Facebook Marketplace export JSON array and import/update in bulk.</p>
                <label className="field-label" htmlFor="facebook-import-json">
                  Facebook JSON payload
                </label>
                <p className="field-help">Provide a JSON array of marketplace items to create or update in bulk.</p>
                <textarea
                  id="facebook-import-json"
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
