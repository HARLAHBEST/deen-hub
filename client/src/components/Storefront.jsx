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

export default function Storefront() {
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState({ wa: "14385403074", fb: "https://m.me/your-fb-page" });
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
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
    return items.filter((it) => {
      const byCat = activeCat === "All" || it.cat === activeCat;
      const bySearch =
        !search ||
        String(it.desc || "").toLowerCase().includes(search.toLowerCase()) ||
        String(it.lot || "").toLowerCase().includes(search.toLowerCase());
      return byCat && bySearch;
    });
  }, [items, search, activeCat]);

  const hotItems = useMemo(() => filtered.filter((it) => it.hot), [filtered]);

  return (
    <div>
      <header className="topbar">Serving Regina, SK - New Stock Weekly</header>
      <nav className="nav">
        <div className="wrap nav-inner">
          <div className="logo-name">Deen&apos;s Daily Hub</div>
          <input
            className="search"
            placeholder="Search items"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <a className="btn btn-fb" href="/admin">
            Admin
          </a>
        </div>
      </nav>

      <section className="hero wrap">
        <h1>
          Quality Items. <span>Great Prices.</span>
        </h1>
        <p>Upgraded to MERN baseline. Inventory now API-driven and ready for MongoDB sync.</p>
        <div className="hero-cta-row">
          <a className="btn btn-wa" href={`https://wa.me/${settings.wa}`} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a className="btn btn-fb" href={settings.fb} target="_blank" rel="noreferrer">
            Messenger
          </a>
        </div>
      </section>

      <section className="wrap section-gap">
        <div className="cat-row">
          <button className={activeCat === "All" ? "chip active" : "chip"} onClick={() => setActiveCat("All")}>
            All
          </button>
          {CATS.map((cat) => (
            <button key={cat} className={activeCat === cat ? "chip active" : "chip"} onClick={() => setActiveCat(cat)}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="wrap section-gap">
        <h2>Hot Deals</h2>
        <div className="grid">
          {hotItems.slice(0, 8).map((it) => (
            <article key={it.uid} className="card hot">
              <div className="badge">HOT</div>
              <h3>{it.desc}</h3>
              <p>Lot {it.lot}</p>
              <strong>{displayPrice(it)}</strong>
            </article>
          ))}
          {!hotItems.length && <p className="muted">No hot deals yet. Mark items in Admin.</p>}
        </div>
      </section>

      <section className="wrap section-gap">
        <h2>Items {loading ? "(loading...)" : `(${filtered.length})`}</h2>
        <div className="grid">
          {filtered.map((it) => (
            <article key={it.uid} className="card">
              <p className="category">{it.cat}</p>
              <h3>{it.desc}</h3>
              <p>
                Lot {it.lot} - {it.inv}
              </p>
              <strong>{displayPrice(it)}</strong>
              <a
                className="small-btn"
                href={`https://wa.me/${settings.wa}?text=${encodeURIComponent(`Hi, I am interested in: ${it.desc}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Ask on WhatsApp
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
