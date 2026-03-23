import { useEffect, useMemo, useState } from "react";
import { fetchPublicItems, getSettings } from "../services/api";

const CATS = [
  "Clothing",
  "Home & Kitchen",
  "Health & Beauty",
  "Electronics",
  "Baby & Kids",
  "Tools",
  "Other"
];

function displayPrice(item) {
  if (item.customPrice && String(item.customPrice).trim()) return item.customPrice;
  const raw = Number(item.cost || 0);
  const rounded = Math.ceil((raw * 2.5) / 5) * 5;
  return `$${rounded}+`;
}

function createWhatsAppUrl(wa, desc) {
  return `https://wa.me/${wa}?text=${encodeURIComponent(`Hi, I am interested in: ${desc}`)}`;
}

function sortItems(list, sortKey) {
  const clone = [...list];
  switch (sortKey) {
    case "priceHigh":
      return clone.sort((a, b) => Number(b.cost || 0) - Number(a.cost || 0));
    case "priceLow":
      return clone.sort((a, b) => Number(a.cost || 0) - Number(b.cost || 0));
    case "nameAZ":
      return clone.sort((a, b) => String(a.desc || "").localeCompare(String(b.desc || "")));
    case "nameZA":
      return clone.sort((a, b) => String(b.desc || "").localeCompare(String(a.desc || "")));
    case "recent":
    default:
      return clone.sort((a, b) => new Date(b.updatedAt || b.date || 0) - new Date(a.updatedAt || a.date || 0));
  }
}

export default function Storefront() {
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState({ wa: "14385403074", fb: "https://m.me/your-fb-page" });
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [itemData, settingsData] = await Promise.all([
          fetchPublicItems({ status: "In Stock", limit: 180 }),
          getSettings()
        ]);
        setItems(itemData);
        setSettings((prev) => ({ ...prev, ...settingsData }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const matched = items.filter((it) => {
      const byCat = activeCat === "All" || it.cat === activeCat;
      const bySearch =
        !search ||
        String(it.desc || "").toLowerCase().includes(search.toLowerCase()) ||
        String(it.lot || "").toLowerCase().includes(search.toLowerCase()) ||
        String(it.inv || "").toLowerCase().includes(search.toLowerCase());
      return byCat && bySearch;
    });
    return sortItems(matched, sortBy);
  }, [items, search, activeCat, sortBy]);

  const hotItems = useMemo(() => items.filter((it) => it.hot).slice(0, 8), [items]);

  const byCategory = useMemo(() => {
    const map = { All: items.length };
    for (let i = 0; i < CATS.length; i += 1) {
      const cat = CATS[i];
      map[cat] = items.filter((it) => it.cat === cat).length;
    }
    return map;
  }, [items]);

  const topCategories = useMemo(() => {
    return [...CATS]
      .map((cat) => ({ cat, count: byCategory[cat] || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [byCategory]);

  return (
    <div className="page-storefront">
      <header className="topbar">Serving Regina, SK · New stock every week · Local pickup</header>

      <nav className="nav">
        <div className="wrap nav-inner storefront-nav">
          <div className="nav-brand">
            <div className="brand-mark">D</div>
            <div>
              <div className="logo-name">Deen&apos;s Daily Hub</div>
              <div className="logo-sub">Warehouse-style savings with weekly arrivals</div>
            </div>
          </div>

          <input
            className="search"
            placeholder="Search by lot, product, category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="nav-actions">
            <a className="btn btn-fb" href={settings.fb} target="_blank" rel="noreferrer">
              Messenger
            </a>
          </div>
        </div>
      </nav>

      <section className="hero wrap section-gap">
        <div className="hero-panel">
          <div>
            <p className="eyebrow">Deen&apos;s Daily Hub · Regina</p>
            <h1>
              Better Products.
              <br />
              Better Margins.
              <br />
              <span>Real Weekly Deals.</span>
            </h1>
            <p className="hero-copy">
              Browse in-stock inventory sourced from auctions and overstock. This storefront updates from your secure
              admin backend and supports real-time filtering, sorting, and contact-ready product cards.
            </p>

            <div className="hero-cta-row">
              <a className="btn btn-wa" href={`https://wa.me/${settings.wa}`} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
              <a className="btn btn-fb" href={settings.fb} target="_blank" rel="noreferrer">
                Messenger
              </a>
            </div>
          </div>

          <div className="hero-stats-grid">
            <article className="stat-card">
              <p>In stock</p>
              <strong>{loading ? "..." : items.length}</strong>
            </article>
            <article className="stat-card">
              <p>Hot deals</p>
              <strong>{hotItems.length}</strong>
            </article>
            <article className="stat-card">
              <p>Categories</p>
              <strong>{CATS.length}</strong>
            </article>
            <article className="stat-card">
              <p>Status</p>
              <strong>{loading ? "Syncing" : "Live"}</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="wrap">
        <div className="insight-row">
          {topCategories.map((entry) => (
            <article key={entry.cat} className="insight-card">
              <p>Top Category</p>
              <strong>{entry.cat}</strong>
              <span>{entry.count} items</span>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap section-gap">
        <div className="cat-row cat-row-modern">
          {["All", ...CATS].map((cat) => (
            <button
              key={cat}
              className={activeCat === cat ? "chip active" : "chip"}
              onClick={() => setActiveCat(cat)}
            >
              <span>{cat}</span>
              <b>{byCategory[cat] || 0}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="wrap section-gap">
        <div className="section-title-row">
          <h2>Hot Deals</h2>
          <p className="muted">Pinned by admin for quick conversion</p>
        </div>

        <div className="grid hot-grid">
          {hotItems.slice(0, 8).map((it) => (
            <article key={it.uid} className="card hot">
              <div className="card-topline">
                <span className="badge">HOT DEAL</span>
                <span className="category">{it.cat}</span>
              </div>
              <h3>{it.desc}</h3>
              <p className="muted">Lot {it.lot}</p>
              <strong>{displayPrice(it)}</strong>
              <a className="small-btn" href={createWhatsAppUrl(settings.wa, it.desc)} target="_blank" rel="noreferrer">
                Ask on WhatsApp
              </a>
            </article>
          ))}
          {!hotItems.length && <p className="muted panel-empty">No hot deals yet. Mark items in Admin.</p>}
        </div>
      </section>

      <section className="wrap section-gap">
        <div className="section-title-row">
          <h2>All Items {loading ? "(loading...)" : `(${filtered.length})`}</h2>
          <p className="muted">Filtered by {activeCat}</p>
        </div>

        <div className="catalog-controls">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Sort: Most Recent</option>
            <option value="priceHigh">Sort: Price High to Low</option>
            <option value="priceLow">Sort: Price Low to High</option>
            <option value="nameAZ">Sort: Name A-Z</option>
            <option value="nameZA">Sort: Name Z-A</option>
          </select>

          <div className="view-toggle">
            <button
              className={viewMode === "grid" ? "small-btn strong" : "small-btn"}
              type="button"
              onClick={() => setViewMode("grid")}
            >
              Grid
            </button>
            <button
              className={viewMode === "compact" ? "small-btn strong" : "small-btn"}
              type="button"
              onClick={() => setViewMode("compact")}
            >
              Compact
            </button>
          </div>
        </div>

        <div className={viewMode === "compact" ? "grid compact-grid" : "grid"}>
          {filtered.map((it) => (
            <article key={it.uid} className={viewMode === "compact" ? "card compact-card" : "card"}>
              <p className="category">{it.cat}</p>
              <h3>{it.desc}</h3>
              <p>
                Lot {it.lot} · Invoice {it.inv}
              </p>
              <strong className="price-strong">{displayPrice(it)}</strong>
              <a className="small-btn" href={createWhatsAppUrl(settings.wa, it.desc)} target="_blank" rel="noreferrer">
                Ask on WhatsApp
              </a>
            </article>
          ))}

          {!loading && !filtered.length && (
            <article className="card panel-empty">
              <h3>No matching items</h3>
              <p className="muted">Try another search term or category.</p>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
