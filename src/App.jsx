import React, { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "trd-marketplace-token";

const categories = ["Todos", "Tecnología", "Libros", "Universidad", "Accesorios"];
const conditions = ["Todos", "Nuevo", "Usado"];

function money(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getInitials(name = "Usuario") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [showAuth, setShowAuth] = useState(false);
  const [activePage, setActivePage] = useState("inicio");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [condition, setCondition] = useState("Todos");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [productMessages, setProductMessages] = useState([]);
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    career: "",
    role: "comprador",
  });
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Tecnología",
    condition: "Nuevo",
    image: "",
    stock: "1",
  });
  const [reviewForm, setReviewForm] = useState({ sellerId: "", rating: 5, comment: "" });
  const [data, setData] = useState({
    users: [],
    products: [],
    cart: [],
    orders: [],
    reviews: [],
    messages: [],
    notifications: [],
    stats: null,
  });

  const accountUser = currentUser || {
    name: "Invitado",
    role: "visitante",
    avatar: "TR",
  };

  async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(payload?.message || "Error conectando con el servidor");
    }

    return payload;
  }

  function setSession(newToken, user) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setCurrentUser(user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setCurrentUser(null);
    setData((prev) => ({ ...prev, cart: [], orders: [], notifications: [], users: [], stats: null }));
    setActivePage("inicio");
    setToast("Sesión cerrada");
  }

  function requireAuth() {
    if (currentUser) return true;
    setAuthMode("login");
    setShowAuth(true);
    setToast("Primero inicia sesión");
    return false;
  }

  async function loadPublicData() {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category !== "Todos") params.set("category", category);
    if (condition !== "Todos") params.set("condition", condition);
    if (maxPrice) params.set("maxPrice", maxPrice);

    const [productsPayload, reviewsPayload] = await Promise.all([
      api(`/products?${params.toString()}`),
      api("/reviews"),
    ]);

    setData((prev) => ({
      ...prev,
      products: productsPayload.products || [],
      reviews: reviewsPayload.reviews || [],
    }));
  }

  async function loadPrivateData() {
    if (!token) return;
    const [mePayload, cartPayload, ordersPayload, notificationsPayload] = await Promise.all([
      api("/auth/me"),
      api("/cart"),
      api("/orders"),
      api("/notifications"),
    ]);

    setCurrentUser(mePayload.user);
    setData((prev) => ({
      ...prev,
      cart: cartPayload.cart || [],
      orders: ordersPayload.orders || [],
      notifications: notificationsPayload.notifications || [],
    }));

    if (mePayload.user?.role === "admin") await loadAdminData();
  }

  async function loadAdminData() {
    const payload = await api("/admin/summary");
    setData((prev) => ({
      ...prev,
      users: payload.users || [],
      products: payload.products?.filter((product) => product.active) || prev.products,
      stats: payload.stats || null,
    }));
  }

  async function loadProductMessages(productId) {
    if (!token || !productId) {
      setProductMessages([]);
      return;
    }
    const payload = await api(`/messages/product/${productId}`);
    setProductMessages(payload.messages || []);
  }

  useEffect(() => {
    async function boot() {
      try {
        setLoading(true);
        await loadPublicData();
      } catch (error) {
        setToast(error.message);
      } finally {
        setLoading(false);
      }
    }
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPublicData().catch((error) => setToast(error.message));
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, condition, maxPrice]);

  useEffect(() => {
    if (!token) return;
    loadPrivateData().catch((error) => {
      localStorage.removeItem(TOKEN_KEY);
      setToken("");
      setCurrentUser(null);
      setToast(error.message);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (selectedProduct?.id && token) {
      loadProductMessages(selectedProduct.id).catch((error) => setToast(error.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct?.id, token]);

  const visibleProducts = data.products.filter((product) => product.active !== false);
  const cartItems = data.cart;
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.qty, 0);
  const unreadCount = data.notifications.filter((notification) => !notification.read).length;
  const activeProducts = data.stats?.activeProducts ?? data.products.filter((product) => product.active !== false).length;
  const sellerProducts = data.products.filter((product) => product.sellerId === currentUser?.id && product.active !== false);
  const myOrders = data.orders;

  const reviewableSellers = useMemo(() => {
    const sellers = new Map();
    myOrders.forEach((order) => {
      order.items.forEach((item) => {
        const seller = item.product?.seller;
        if (seller?.id) sellers.set(seller.id, seller);
      });
    });
    return Array.from(sellers.values());
  }, [myOrders]);

  function sellerOf(product) {
    return product.seller || data.users.find((user) => user.id === product.sellerId) || { name: "Vendedor", reputation: 0 };
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const payload = await api(endpoint, {
        method: "POST",
        body: JSON.stringify(authForm),
      });
      setSession(payload.token, payload.user);
      setShowAuth(false);
      setAuthForm({ name: "", email: "", password: "", career: "", role: "comprador" });
      setToast(authMode === "login" ? `Bienvenido, ${payload.user.name}` : "Cuenta creada correctamente");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function addToCart(productId) {
    if (!requireAuth()) return;
    try {
      const payload = await api("/cart", {
        method: "POST",
        body: JSON.stringify({ productId }),
      });
      setData((prev) => ({ ...prev, cart: payload.cart || [] }));
      setToast(payload.message || "Producto agregado al carrito");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function removeFromCart(productId) {
    try {
      const payload = await api(`/cart/${productId}`, { method: "DELETE" });
      setData((prev) => ({ ...prev, cart: payload.cart || [] }));
    } catch (error) {
      setToast(error.message);
    }
  }

  async function confirmPurchase() {
    if (!requireAuth()) return;
    if (!cartItems.length) {
      setToast("El carrito está vacío");
      return;
    }

    try {
      const payload = await api("/cart/checkout", { method: "POST" });
      setData((prev) => ({
        ...prev,
        cart: payload.cart || [],
        orders: [payload.order, ...prev.orders],
      }));
      await Promise.all([loadPublicData(), loadPrivateData()]);
      setToast("Compra confirmada. Revisa tu historial.");
      setActivePage("ordenes");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function publishProduct(event) {
    event.preventDefault();
    if (!requireAuth()) return;

    try {
      const payload = await api("/products", {
        method: "POST",
        body: JSON.stringify(productForm),
      });
      setData((prev) => ({ ...prev, products: [payload.product, ...prev.products] }));
      setProductForm({
        title: "",
        description: "",
        price: "",
        category: "Tecnología",
        condition: "Nuevo",
        image: "",
        stock: "1",
      });
      await loadPrivateData();
      setToast("Producto publicado correctamente");
      setActivePage("mis-productos");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function deleteProduct(productId) {
    if (!requireAuth()) return;
    try {
      await api(`/products/${productId}`, { method: "DELETE" });
      setData((prev) => ({
        ...prev,
        products: prev.products.filter((product) => product.id !== productId),
      }));
      setToast("Producto eliminado");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function toggleSuspendUser(userId) {
    try {
      await api(`/admin/users/${userId}/suspend`, { method: "PATCH" });
      await loadAdminData();
      setToast("Estado del usuario actualizado");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function sendMessage(product) {
    if (!requireAuth()) return;
    if (!messageText.trim()) return;

    try {
      const payload = await api("/messages", {
        method: "POST",
        body: JSON.stringify({ productId: product.id, text: messageText }),
      });
      setProductMessages((prev) => [...prev, payload.message]);
      setMessageText("");
      setToast("Mensaje enviado al vendedor");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function submitReview(event) {
    event.preventDefault();
    if (!requireAuth()) return;

    try {
      await api("/reviews", {
        method: "POST",
        body: JSON.stringify(reviewForm),
      });
      setReviewForm({ sellerId: "", rating: 5, comment: "" });
      await Promise.all([loadPublicData(), loadPrivateData()]);
      setToast("Reseña publicada");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function markNotificationsRead() {
    if (!requireAuth()) return;
    try {
      const payload = await api("/notifications/read-all", { method: "PATCH" });
      setData((prev) => ({ ...prev, notifications: payload.notifications || [] }));
    } catch (error) {
      setToast(error.message);
    }
  }

  async function resetDemo() {
    if (currentUser?.role !== "admin") return;
    try {
      await api("/admin/reset", { method: "POST" });
      localStorage.removeItem(TOKEN_KEY);
      setToken("");
      setCurrentUser(null);
      setActivePage("inicio");
      await loadPublicData();
      setToast("Demo reiniciada. Vuelve a iniciar sesión como admin.");
    } catch (error) {
      setToast(error.message);
    }
  }

  return (
    <div className="app-shell">
      <style>{styles}</style>

      {toast && <div className="toast">{toast}</div>}

      <header className="topbar">
        <div className="brand" onClick={() => setActivePage("inicio")}>
          <div className="brand-mark">TRD</div>
          <div>
            <strong>TRD Marketplace</strong>
            <span>Universidad de La Sabana</span>
          </div>
        </div>

        <nav className="nav-links">
          <button className={activePage === "inicio" ? "active" : ""} onClick={() => setActivePage("inicio")}>Inicio</button>
          <button className={activePage === "publicar" ? "active" : ""} onClick={() => setActivePage("publicar")}>Publicar</button>
          <button className={activePage === "carrito" ? "active" : ""} onClick={() => currentUser ? setActivePage("carrito") : requireAuth()}>Carrito {cartItems.length > 0 && <b>{cartItems.length}</b>}</button>
          <button className={activePage === "ordenes" ? "active" : ""} onClick={() => currentUser ? setActivePage("ordenes") : requireAuth()}>Órdenes</button>
          <button className={activePage === "notificaciones" ? "active" : ""} onClick={() => currentUser ? setActivePage("notificaciones") : requireAuth()}>Notificaciones {unreadCount > 0 && <b>{unreadCount}</b>}</button>
          {currentUser?.role === "admin" && (
            <button className={activePage === "admin" ? "active" : ""} onClick={() => { setActivePage("admin"); loadAdminData().catch((error) => setToast(error.message)); }}>Admin</button>
          )}
        </nav>

        <div className="account-box">
          <div className="avatar">{accountUser.avatar || getInitials(accountUser.name)}</div>
          <div className="account-text">
            <strong>{accountUser.name}</strong>
            <span>{accountUser.role}</span>
          </div>
          {currentUser ? (
            <button className="outline small" onClick={logout}>Salir</button>
          ) : (
            <button className="outline small" onClick={() => setShowAuth(true)}>Entrar</button>
          )}
        </div>
      </header>

      {activePage === "inicio" && (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow">Compra y venta entre estudiantes</span>
              <h1>Marketplace institucional, confiable y fácil de usar.</h1>
              <p>
                Publica productos, contacta vendedores, compra con carrito simulado y revisa tu historial desde una sola plataforma universitaria.
              </p>
              <div className="hero-actions">
                <button className="primary" onClick={() => currentUser ? setActivePage("publicar") : requireAuth()}>Publicar producto</button>
                <button className="secondary" onClick={() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })}>Ver catálogo</button>
              </div>
            </div>

            <div className="hero-card">
              <div className="metric-grid">
                <div><strong>{activeProducts}</strong><span>Productos activos</span></div>
                <div><strong>{data.stats?.users ?? data.users.length || "--"}</strong><span>Usuarios</span></div>
                <div><strong>{data.stats?.orders ?? data.orders.length}</strong><span>Órdenes</span></div>
                <div><strong>{data.stats?.reviews ?? data.reviews.length}</strong><span>Reseñas</span></div>
              </div>
              <div className="trust-card">
                <strong>Confianza Sabana</strong>
                <p>Perfiles, reputación, reseñas y moderación para una comunidad más segura.</p>
              </div>
            </div>
          </section>

          <section className="filters" id="catalogo">
            <div className="search-box">
              <span>🔎</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por producto, categoría o descripción" />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}>
              {conditions.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" placeholder="Precio máximo" />
          </section>

          <section className="section-head">
            <div>
              <span className="eyebrow">Catálogo</span>
              <h2>Productos disponibles</h2>
            </div>
            <p>{loading ? "Cargando..." : `${visibleProducts.length} resultado(s)`}</p>
          </section>

          <section className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="image-wrap">
                  <img src={product.image} alt={product.title} />
                  {product.featured && <span className="badge gold">Destacado</span>}
                  <span className="badge condition">{product.condition}</span>
                </div>
                <div className="product-body">
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  <div className="seller-line">
                    <span>👤 {sellerOf(product).name}</span>
                    <span>⭐ {sellerOf(product).reputation || "Nuevo"}</span>
                  </div>
                  <div className="price-line">
                    <strong>{money(product.price)}</strong>
                    <span>Stock: {product.stock}</span>
                  </div>
                  <div className="card-actions">
                    <button className="primary" onClick={() => addToCart(product.id)} disabled={product.stock <= 0}>
                      {product.stock <= 0 ? "Agotado" : "Agregar"}
                    </button>
                    <button className="outline" onClick={() => setSelectedProduct(product)}>Ver detalle</button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </main>
      )}

      {activePage === "publicar" && (
        <main className="page-grid">
          <section className="panel form-panel">
            <span className="eyebrow">Vender</span>
            <h2>Publicar producto</h2>
            <p className="muted">Al publicar, tu cuenta queda habilitada como vendedor automáticamente.</p>
            <form onSubmit={publishProduct} className="form-grid">
              <label>Título<input value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} placeholder="Ej: Libro de cálculo" /></label>
              <label>Precio<input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="Ej: 85000" /></label>
              <label>Categoría<select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>{categories.filter((item) => item !== "Todos").map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Estado<select value={productForm.condition} onChange={(e) => setProductForm({ ...productForm, condition: e.target.value })}><option>Nuevo</option><option>Usado</option></select></label>
              <label>Stock<input type="number" min="1" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} /></label>
              <label>URL de imagen<input value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} placeholder="Opcional: pega una URL de imagen" /></label>
              <label className="full">Descripción<textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="Describe el estado, entrega y detalles del producto" /></label>
              <button className="primary full" type="submit">Publicar ahora</button>
            </form>
          </section>

          <section className="panel">
            <span className="eyebrow">Mis ventas</span>
            <h2>Mis productos</h2>
            {!currentUser ? <p className="muted">Inicia sesión para ver tus productos.</p> : sellerProducts.length === 0 ? (
              <p className="muted">Todavía no tienes productos publicados.</p>
            ) : (
              <div className="list-stack">
                {sellerProducts.map((product) => (
                  <div className="mini-item" key={product.id}>
                    <img src={product.image} alt={product.title} />
                    <div><strong>{product.title}</strong><span>{money(product.price)} · {product.condition}</span></div>
                    <button className="danger" onClick={() => deleteProduct(product.id)}>Eliminar</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {activePage === "mis-productos" && (
        <main className="panel page-only">
          <span className="eyebrow">Inventario</span>
          <h2>Mis productos publicados</h2>
          <div className="list-stack">
            {sellerProducts.map((product) => (
              <div className="mini-item" key={product.id}>
                <img src={product.image} alt={product.title} />
                <div><strong>{product.title}</strong><span>{money(product.price)} · Stock {product.stock}</span></div>
                <button className="danger" onClick={() => deleteProduct(product.id)}>Eliminar</button>
              </div>
            ))}
          </div>
        </main>
      )}

      {activePage === "carrito" && (
        <main className="page-grid">
          <section className="panel">
            <span className="eyebrow">Compra</span>
            <h2>Carrito</h2>
            {cartItems.length === 0 ? <p className="muted">Tu carrito está vacío.</p> : (
              <div className="list-stack">
                {cartItems.map((item) => (
                  <div className="mini-item" key={item.productId}>
                    <img src={item.product.image} alt={item.product.title} />
                    <div><strong>{item.product.title}</strong><span>{money(item.product.price)} · Cantidad {item.qty}</span></div>
                    <button className="danger" onClick={() => removeFromCart(item.product.id)}>Quitar</button>
                  </div>
                ))}
              </div>
            )}
          </section>
          <aside className="panel checkout-card">
            <span className="eyebrow">Resumen</span>
            <h2>{money(cartTotal)}</h2>
            <p className="muted">Pago simulado para MVP. No se integra pasarela real.</p>
            <button className="primary full" onClick={confirmPurchase}>Confirmar compra</button>
          </aside>
        </main>
      )}

      {activePage === "ordenes" && (
        <main className="page-grid">
          <section className="panel">
            <span className="eyebrow">Historial</span>
            <h2>Mis órdenes</h2>
            {myOrders.length === 0 ? <p className="muted">Aún no tienes compras.</p> : (
              <div className="list-stack">
                {myOrders.map((order) => (
                  <div className="order-card" key={order.id}>
                    <div><strong>Orden #{String(order.id).slice(-6)}</strong><span>{order.date} · {order.status}</span></div>
                    <strong>{money(order.total)}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="panel">
            <span className="eyebrow">Reseñas</span>
            <h2>Calificar vendedor</h2>
            <form onSubmit={submitReview} className="form-grid single">
              <label>Vendedor<select value={reviewForm.sellerId} onChange={(e) => setReviewForm({ ...reviewForm, sellerId: e.target.value })}><option value="">Selecciona...</option>{reviewableSellers.map((seller) => <option value={seller.id} key={seller.id}>{seller.name}</option>)}</select></label>
              <label>Rating<select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}><option value="5">5 - Excelente</option><option value="4">4 - Bueno</option><option value="3">3 - Normal</option><option value="2">2 - Regular</option><option value="1">1 - Malo</option></select></label>
              <label className="full">Comentario<textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Escribe tu experiencia" /></label>
              <button className="primary full">Enviar reseña</button>
            </form>
          </section>
        </main>
      )}

      {activePage === "notificaciones" && (
        <main className="panel page-only">
          <div className="section-row">
            <div><span className="eyebrow">Centro de actividad</span><h2>Notificaciones</h2></div>
            <button className="outline" onClick={markNotificationsRead}>Marcar como leídas</button>
          </div>
          <div className="list-stack">
            {data.notifications.map((notification) => (
              <div className={`notification ${notification.read ? "read" : ""}`} key={notification.id}>
                <span>{notification.type}</span><strong>{notification.text}</strong>
              </div>
            ))}
          </div>
        </main>
      )}

      {activePage === "admin" && currentUser?.role === "admin" && (
        <main className="page-grid admin-grid">
          <section className="panel">
            <span className="eyebrow">Dashboard</span>
            <h2>Panel de administrador</h2>
            <div className="metric-grid admin-metrics">
              <div><strong>{data.stats?.users ?? data.users.length}</strong><span>Usuarios registrados</span></div>
              <div><strong>{data.stats?.activeProducts ?? activeProducts}</strong><span>Productos activos</span></div>
              <div><strong>{data.stats?.orders ?? data.orders.length}</strong><span>Órdenes</span></div>
              <div><strong>{data.stats?.messages ?? 0}</strong><span>Mensajes</span></div>
            </div>
            <button className="outline full" onClick={resetDemo}>Reiniciar demo</button>
          </section>
          <section className="panel">
            <span className="eyebrow">Usuarios</span>
            <h2>Gestión de usuarios</h2>
            <div className="list-stack">
              {data.users.map((user) => (
                <div className="user-row" key={user.id}>
                  <div className="avatar small-avatar">{user.avatar}</div>
                  <div><strong>{user.name}</strong><span>{user.email} · {user.role}</span></div>
                  {user.role !== "admin" && <button className={user.suspended ? "primary" : "danger"} onClick={() => toggleSuspendUser(user.id)}>{user.suspended ? "Activar" : "Suspender"}</button>}
                </div>
              ))}
            </div>
          </section>
          <section className="panel full-panel">
            <span className="eyebrow">Moderación</span>
            <h2>Productos publicados</h2>
            <div className="list-stack">
              {data.products.filter((p) => p.active !== false).map((product) => (
                <div className="mini-item" key={product.id}>
                  <img src={product.image} alt={product.title} />
                  <div><strong>{product.title}</strong><span>{sellerOf(product).name} · {money(product.price)}</span></div>
                  <button className="danger" onClick={() => deleteProduct(product.id)}>Eliminar</button>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <section className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>×</button>
            <img className="modal-image" src={selectedProduct.image} alt={selectedProduct.title} />
            <div className="modal-content">
              <span className="badge gold">{selectedProduct.category}</span>
              <h2>{selectedProduct.title}</h2>
              <p>{selectedProduct.description}</p>
              <h3>{money(selectedProduct.price)}</h3>
              <div className="seller-profile">
                <div className="avatar">{sellerOf(selectedProduct).avatar || getInitials(sellerOf(selectedProduct).name)}</div>
                <div><strong>{sellerOf(selectedProduct).name}</strong><span>Reputación ⭐ {sellerOf(selectedProduct).reputation || "Nuevo"}</span></div>
              </div>
              <div className="modal-actions">
                <button className="primary" onClick={() => addToCart(selectedProduct.id)}>Agregar al carrito</button>
                <button className="outline" onClick={() => setSelectedProduct(null)}>Cerrar</button>
              </div>
              <div className="chat-box">
                <h3>Chat con vendedor</h3>
                {!currentUser ? <p className="muted">Inicia sesión para enviar mensajes.</p> : (
                  <>
                    <div className="messages">
                      {productMessages.slice(-4).map((message) => (
                        <div className={`message ${message.from?.id === currentUser?.id ? "mine" : ""}`} key={message.id}>
                          <span>{message.from?.name || "Usuario"}</span><p>{message.text}</p>
                        </div>
                      ))}
                    </div>
                    <div className="message-input">
                      <input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Escribe un mensaje" />
                      <button className="primary" onClick={() => sendMessage(selectedProduct)}>Enviar</button>
                    </div>
                  </>
                )}
              </div>
              <div className="reviews-box">
                <h3>Reseñas del vendedor</h3>
                {data.reviews.filter((review) => review.sellerId === selectedProduct.sellerId).length === 0 ? <p className="muted">Este vendedor aún no tiene reseñas.</p> : (
                  data.reviews.filter((review) => review.sellerId === selectedProduct.sellerId).map((review) => (
                    <div className="review" key={review.id}><strong>{"⭐".repeat(review.rating)}</strong><p>{review.comment}</p></div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {showAuth && (
        <div className="modal-backdrop" onClick={() => setShowAuth(false)}>
          <section className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuth(false)}>×</button>
            <div className="brand auth-brand">
              <div className="brand-mark">TRD</div>
              <div><strong>{authMode === "login" ? "Iniciar sesión" : "Crear cuenta"}</strong><span>Correo institucional</span></div>
            </div>
            <div className="auth-switch">
              <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Login</button>
              <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Registro</button>
            </div>
            <form className="form-grid single" onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <>
                  <label>Nombre<input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Tu nombre" /></label>
                  <label>Carrera<input value={authForm.career} onChange={(e) => setAuthForm({ ...authForm, career: e.target.value })} placeholder="Ej: Ingeniería" /></label>
                  <label>Rol inicial<select value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}><option value="comprador">Comprador</option><option value="vendedor">Vendedor</option></select></label>
                </>
              )}
              <label>Correo<input value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="usuario@unisabana.edu.co" /></label>
              <label>Contraseña<input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="Contraseña" /></label>
              <button className="primary full" type="submit">{authMode === "login" ? "Entrar" : "Registrarme"}</button>
            </form>
            <div className="demo-users">
              <strong>Usuarios de prueba</strong>
              <span>admin@unisabana.edu.co / admin123</span>
              <span>laura@unisabana.edu.co / 123456</span>
              <span>carlos@unisabana.edu.co / 123456</span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const styles = `
:root {
  --blue: #071f45;
  --blue-2: #0d356d;
  --gold: #caa64b;
  --gold-2: #f4d77d;
  --bg: #f4f7fb;
  --surface: #ffffff;
  --text: #172033;
  --muted: #6f7b91;
  --border: #e3e8f2;
  --danger: #d94c4c;
  --shadow: 0 18px 45px rgba(7, 31, 69, 0.12);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--text);
  background: radial-gradient(circle at top left, rgba(202, 166, 75, 0.18), transparent 32%), var(--bg);
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  border: 0;
  cursor: pointer;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

img {
  max-width: 100%;
  display: block;
}

.app-shell {
  min-height: 100vh;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 24px;
  align-items: center;
  padding: 16px 34px;
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(14px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  color: white;
  font-weight: 900;
  letter-spacing: -0.06em;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--blue), var(--blue-2));
  border: 2px solid rgba(202, 166, 75, 0.75);
  box-shadow: 0 10px 25px rgba(7, 31, 69, 0.25);
}

.brand strong,
.account-text strong {
  display: block;
  line-height: 1.1;
}

.brand span,
.account-text span,
.muted,
.seller-line,
.price-line span,
.mini-item span,
.user-row span,
.order-card span,
.demo-users span {
  color: var(--muted);
  font-size: 0.88rem;
}

.nav-links {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.nav-links button,
.auth-switch button {
  color: var(--blue);
  background: transparent;
  padding: 10px 12px;
  border-radius: 999px;
  font-weight: 700;
}

.nav-links button.active,
.nav-links button:hover,
.auth-switch button.active {
  background: rgba(7, 31, 69, 0.08);
}

.nav-links b {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  margin-left: 4px;
  color: var(--blue);
  background: var(--gold-2);
  border-radius: 999px;
  font-size: 0.75rem;
}

.account-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  display: grid;
  place-items: center;
  min-width: 44px;
  height: 44px;
  color: white;
  font-weight: 900;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), var(--blue));
}

.small-avatar {
  min-width: 36px;
  height: 36px;
  font-size: 0.8rem;
}

main {
  width: min(1180px, calc(100% - 34px));
  margin: 0 auto;
}

.hero {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 32px;
  align-items: center;
  padding: 54px 0 28px;
}

.hero-copy {
  padding: 38px;
  color: white;
  background: linear-gradient(135deg, var(--blue), #103d78 72%, var(--gold));
  border-radius: 34px;
  box-shadow: var(--shadow);
  overflow: hidden;
  position: relative;
}

.hero-copy:after {
  content: "";
  position: absolute;
  width: 230px;
  height: 230px;
  right: -70px;
  top: -60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--gold);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
}

.hero-copy .eyebrow {
  color: var(--gold-2);
}

.hero h1 {
  position: relative;
  margin: 12px 0 12px;
  font-size: clamp(2.2rem, 5vw, 4.7rem);
  line-height: 0.95;
  letter-spacing: -0.07em;
  max-width: 760px;
}

.hero p {
  position: relative;
  color: rgba(255, 255, 255, 0.82);
  font-size: 1.08rem;
  line-height: 1.7;
  max-width: 640px;
}

.hero-actions,
.card-actions,
.modal-actions,
.message-input,
.section-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.primary,
.secondary,
.outline,
.danger {
  padding: 12px 16px;
  border-radius: 14px;
  font-weight: 900;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.primary {
  color: white;
  background: linear-gradient(135deg, var(--blue), var(--blue-2));
  box-shadow: 0 12px 22px rgba(7, 31, 69, 0.2);
}

.secondary {
  color: var(--blue);
  background: var(--gold-2);
}

.outline {
  color: var(--blue);
  background: white;
  border: 1px solid var(--border);
}

.danger {
  color: white;
  background: var(--danger);
}

.small {
  padding: 8px 11px;
  border-radius: 12px;
  font-size: 0.84rem;
}

.primary:hover,
.secondary:hover,
.outline:hover,
.danger:hover {
  transform: translateY(-1px);
}

.hero-card,
.panel,
.product-card,
.filters {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--border);
  border-radius: 28px;
  box-shadow: var(--shadow);
}

.hero-card {
  padding: 22px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.metric-grid div {
  padding: 18px;
  border-radius: 22px;
  background: linear-gradient(180deg, #f9fbff, #eef3fb);
  border: 1px solid var(--border);
}

.metric-grid strong {
  display: block;
  color: var(--blue);
  font-size: 2rem;
  line-height: 1;
}

.metric-grid span {
  color: var(--muted);
  font-size: 0.86rem;
}

.trust-card {
  margin-top: 14px;
  padding: 20px;
  color: white;
  border-radius: 22px;
  background: linear-gradient(135deg, var(--blue), var(--gold));
}

.trust-card p {
  color: rgba(255, 255, 255, 0.82);
  margin-bottom: 0;
}

.filters {
  display: grid;
  grid-template-columns: 1fr 170px 150px 160px;
  gap: 12px;
  padding: 14px;
  margin: 16px 0 28px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: white;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 13px 14px;
  background: white;
  color: var(--text);
  outline: none;
}

.search-box input {
  border: 0;
  padding-inline: 0;
}

textarea {
  min-height: 120px;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: rgba(202, 166, 75, 0.9);
  box-shadow: 0 0 0 4px rgba(202, 166, 75, 0.16);
}

.section-head,
.section-row {
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-head h2,
.panel h2 {
  margin: 6px 0 8px;
  color: var(--blue);
  font-size: clamp(1.55rem, 3vw, 2.25rem);
  letter-spacing: -0.04em;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
  padding-bottom: 54px;
}

.product-card {
  overflow: hidden;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 55px rgba(7, 31, 69, 0.16);
}

.image-wrap {
  position: relative;
  height: 210px;
  background: #dfe6f1;
  overflow: hidden;
}

.image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 900;
}

.badge.gold {
  color: var(--blue);
  background: var(--gold-2);
}

.badge.condition {
  position: absolute;
  right: 12px;
  bottom: 12px;
  color: white;
  background: rgba(7, 31, 69, 0.78);
  backdrop-filter: blur(8px);
}

.image-wrap .badge.gold {
  position: absolute;
  top: 12px;
  left: 12px;
}

.product-body {
  padding: 18px;
}

.product-body h3 {
  margin: 0 0 8px;
  color: var(--blue);
  letter-spacing: -0.03em;
}

.product-body p {
  color: var(--muted);
  min-height: 66px;
  line-height: 1.45;
}

.seller-line,
.price-line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
}

.price-line strong {
  color: var(--blue);
  font-size: 1.35rem;
}

.card-actions {
  margin-top: 16px;
}

.page-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 24px;
  padding: 36px 0 60px;
}

.admin-grid {
  grid-template-columns: 0.9fr 1.1fr;
}

.panel {
  padding: 24px;
}

.page-only {
  margin-top: 36px;
  margin-bottom: 60px;
}

.full-panel {
  grid-column: 1 / -1;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-top: 16px;
}

.form-grid.single {
  grid-template-columns: 1fr;
}

label {
  display: grid;
  gap: 8px;
  color: var(--blue);
  font-weight: 800;
}

.full {
  grid-column: 1 / -1;
  width: 100%;
}

.list-stack {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.mini-item,
.user-row,
.order-card,
.notification {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: #fbfcff;
}

.mini-item img {
  width: 70px;
  height: 70px;
  border-radius: 16px;
  object-fit: cover;
}

.mini-item strong,
.user-row strong,
.order-card strong {
  display: block;
  color: var(--blue);
}

.checkout-card {
  height: fit-content;
  position: sticky;
  top: 96px;
}

.checkout-card h2 {
  font-size: 2.8rem;
}

.order-card {
  grid-template-columns: 1fr auto;
}

.notification {
  grid-template-columns: 120px 1fr;
}

.notification span {
  color: var(--blue);
  font-weight: 900;
}

.notification.read {
  opacity: 0.62;
}

.admin-metrics {
  margin: 18px 0;
}

.toast {
  position: fixed;
  z-index: 80;
  right: 24px;
  bottom: 24px;
  max-width: 360px;
  padding: 14px 18px;
  color: white;
  background: linear-gradient(135deg, var(--blue), var(--gold));
  border-radius: 18px;
  box-shadow: var(--shadow);
  font-weight: 800;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(7, 31, 69, 0.62);
  backdrop-filter: blur(8px);
}

.modal,
.auth-modal {
  position: relative;
  width: min(980px, 100%);
  max-height: 92vh;
  overflow: auto;
  background: white;
  border-radius: 30px;
  box-shadow: 0 35px 80px rgba(0, 0, 0, 0.28);
}

.modal {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
}

.auth-modal {
  width: min(460px, 100%);
  padding: 26px;
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  color: var(--blue);
  background: white;
  border-radius: 50%;
  box-shadow: var(--shadow);
  font-size: 1.6rem;
}

.modal-image {
  width: 100%;
  height: 100%;
  min-height: 620px;
  object-fit: cover;
}

.modal-content {
  padding: 28px;
}

.modal-content h2 {
  color: var(--blue);
  margin-bottom: 8px;
  font-size: 2.1rem;
  letter-spacing: -0.04em;
}

.modal-content h3 {
  color: var(--blue);
  font-size: 1.7rem;
}

.seller-profile {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: #fbfcff;
  margin: 14px 0;
}

.seller-profile span {
  color: var(--muted);
}

.chat-box,
.reviews-box {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.messages {
  display: grid;
  gap: 10px;
  max-height: 210px;
  overflow: auto;
  padding-right: 6px;
  margin-bottom: 12px;
}

.message {
  width: fit-content;
  max-width: 82%;
  padding: 10px 12px;
  border-radius: 16px 16px 16px 4px;
  background: #eef3fb;
}

.message.mine {
  justify-self: end;
  color: white;
  background: var(--blue);
  border-radius: 16px 16px 4px 16px;
}

.message span {
  display: block;
  font-size: 0.72rem;
  font-weight: 900;
  opacity: 0.72;
}

.message p,
.review p {
  margin: 4px 0 0;
}

.message-input {
  display: grid;
  grid-template-columns: 1fr auto;
}

.review {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 18px;
  margin-top: 10px;
  background: #fbfcff;
}

.auth-brand {
  margin-bottom: 20px;
}

.auth-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 6px;
  border-radius: 999px;
  background: #eef3fb;
  margin-bottom: 16px;
}

.demo-users {
  display: grid;
  gap: 4px;
  margin-top: 18px;
  padding: 14px;
  border-radius: 18px;
  background: #f7f9fd;
  border: 1px dashed var(--border);
}

@media (max-width: 1040px) {
  .topbar {
    grid-template-columns: 1fr;
  }

  .nav-links {
    justify-content: flex-start;
  }

  .account-box {
    justify-content: space-between;
  }

  .hero,
  .page-grid,
  .modal {
    grid-template-columns: 1fr;
  }

  .modal-image {
    max-height: 360px;
    min-height: 260px;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 680px) {
  .topbar {
    padding: 14px;
  }

  main {
    width: min(100% - 22px, 1180px);
  }

  .hero {
    padding-top: 22px;
  }

  .hero-copy,
  .panel {
    padding: 20px;
    border-radius: 24px;
  }

  .hero h1 {
    font-size: 2.45rem;
  }

  .filters,
  .product-grid,
  .form-grid,
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .mini-item,
  .user-row,
  .notification {
    grid-template-columns: 1fr;
  }

  .mini-item img {
    width: 100%;
    height: 160px;
  }

  .message-input {
    grid-template-columns: 1fr;
  }
}
`;
