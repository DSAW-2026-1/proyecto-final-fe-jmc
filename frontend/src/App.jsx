import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "marketplace-sabana-demo-v1";

const initialUsers = [
  {
    id: 1,
    name: "Admin Universidad",
    email: "admin@unisabana.edu.co",
    password: "admin123",
    career: "Administración",
    role: "admin",
    avatar: "AU",
    reputation: 5,
    suspended: false,
  },
  {
    id: 2,
    name: "Laura Gómez",
    email: "laura@unisabana.edu.co",
    password: "123456",
    career: "Medicina",
    role: "vendedor",
    avatar: "LG",
    reputation: 4.8,
    suspended: false,
  },
  {
    id: 3,
    name: "Carlos Mejía",
    email: "carlos@unisabana.edu.co",
    password: "123456",
    career: "Ingeniería",
    role: "vendedor",
    avatar: "CM",
    reputation: 4.5,
    suspended: false,
  },
];

const initialProducts = [
  {
    id: 101,
    title: "Calculadora Casio FX-991LA",
    description: "Calculadora científica en excelente estado, ideal para cálculo, física y estadística.",
    price: 75000,
    category: "Tecnología",
    condition: "Usado",
    image: "https://images.unsplash.com/photo-1616627986870-1c57f8f5383f?auto=format&fit=crop&w=900&q=80",
    sellerId: 2,
    stock: 1,
    active: true,
    featured: true,
    createdAt: "2026-05-01",
  },
  {
    id: 102,
    title: "Libro Microeconomía Intermedia",
    description: "Libro usado, subrayado suavemente. Perfecto para Micro III.",
    price: 62000,
    category: "Libros",
    condition: "Usado",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80",
    sellerId: 3,
    stock: 2,
    active: true,
    featured: false,
    createdAt: "2026-05-03",
  },
  {
    id: 103,
    title: "Audífonos Bluetooth Pro",
    description: "Buen sonido, micrófono funcional para llamadas y clases virtuales.",
    price: 95000,
    category: "Tecnología",
    condition: "Nuevo",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    sellerId: 2,
    stock: 4,
    active: true,
    featured: true,
    createdAt: "2026-05-04",
  },
  {
    id: 104,
    title: "Bata blanca laboratorio",
    description: "Talla M. Limpia, cómoda y lista para prácticas de laboratorio.",
    price: 45000,
    category: "Universidad",
    condition: "Usado",
    image: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=900&q=80",
    sellerId: 2,
    stock: 1,
    active: true,
    featured: false,
    createdAt: "2026-04-28",
  },
  {
    id: 105,
    title: "Mochila universitaria impermeable",
    description: "Espacio para portátil, bolsillos internos y tela resistente al agua.",
    price: 88000,
    category: "Accesorios",
    condition: "Nuevo",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    sellerId: 3,
    stock: 3,
    active: true,
    featured: true,
    createdAt: "2026-05-05",
  },
  {
    id: 106,
    title: "Kit Arduino básico",
    description: "Incluye protoboard, jumpers, LEDs, resistencias y sensores básicos.",
    price: 120000,
    category: "Tecnología",
    condition: "Usado",
    image: "https://images.unsplash.com/photo-1603732551658-5fabbafa84eb?auto=format&fit=crop&w=900&q=80",
    sellerId: 3,
    stock: 1,
    active: true,
    featured: false,
    createdAt: "2026-04-30",
  },
];

const initialReviews = [
  {
    id: 1,
    sellerId: 2,
    buyerId: 3,
    rating: 5,
    comment: "Entrega rápida y producto tal cual la publicación.",
  },
  {
    id: 2,
    sellerId: 3,
    buyerId: 2,
    rating: 4,
    comment: "Muy buena comunicación, recomendado.",
  },
];

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

function loadData() {
  return {
    users: initialUsers,
    products: initialProducts,
    cart: [],
    orders: [],
    reviews: initialReviews,
    messages: [
      {
        id: 1,
        productId: 101,
        from: 3,
        to: 2,
        text: "Hola, ¿la calculadora todavía está disponible?",
        date: "Hoy",
      },
      {
        id: 2,
        productId: 101,
        from: 2,
        to: 3,
        text: "Sí, te la puedo entregar en el campus.",
        date: "Hoy",
      },
    ],
    notifications: [
      { id: 1, text: "Nuevo producto destacado en Tecnología", read: false, type: "Producto" },
      { id: 2, text: "Recuerda verificar tu correo institucional", read: false, type: "Cuenta" },
    ],
  };
}

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [data, setData] = useState(loadData);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [showAuth, setShowAuth] = useState(false);
  const [activePage, setActivePage] = useState("inicio");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [condition, setCondition] = useState("Todos");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState("");
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
  const [messageText, setMessageText] = useState("");
  const [reviewForm, setReviewForm] = useState({ sellerId: "", rating: 5, comment: "" });
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    password: "",
    career: "",
    role: "comprador",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const user = data.users.find((item) => item.id === currentUserId);
    if (!user) return;
    setProfileForm({
      name: user.name || "",
      email: user.email || "",
      password: user.password || "",
      career: user.career || "",
      role: user.role || "comprador",
    });
  }, [currentUserId, data.users]);

  const currentUser = useMemo(
    () => data.users.find((user) => user.id === currentUserId) || null,
    [data.users, currentUserId]
  );

  const visibleProducts = useMemo(() => {
    return data.products
      .filter((product) => product.active)
      .filter((product) => {
        const text = `${product.title} ${product.description} ${product.category}`.toLowerCase();
        return text.includes(query.toLowerCase());
      })
      .filter((product) => category === "Todos" || product.category === category)
      .filter((product) => condition === "Todos" || product.condition === condition)
      .filter((product) => !maxPrice || Number(product.price) <= Number(maxPrice))
      .sort((a, b) => Number(b.featured) - Number(a.featured) || b.id - a.id);
  }, [data.products, query, category, condition, maxPrice]);

  const cartItems = useMemo(() => {
    if (!currentUser) return [];
    return data.cart
      .filter((item) => item.userId === currentUser.id)
      .map((item) => ({
        ...item,
        product: data.products.find((product) => product.id === item.productId),
      }))
      .filter((item) => item.product);
  }, [data.cart, data.products, currentUser]);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const unreadCount = data.notifications.filter((n) => !n.read).length;
  const activeProducts = data.products.filter((p) => p.active).length;
  const sellerProducts = currentUser
    ? data.products.filter((p) => p.sellerId === currentUser.id && p.active)
    : [];
  const myOrders = currentUser
    ? data.orders.filter((order) => order.buyerId === currentUser.id)
    : [];

  function updateData(updater) {
    setData((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }

  function notify(text, type = "Sistema") {
    updateData((prev) => ({
      ...prev,
      notifications: [{ id: Date.now(), text, type, read: false }, ...prev.notifications],
    }));
    setToast(text);
  }

  function handleAuthSubmit(event) {
    event.preventDefault();
    const email = authForm.email.trim().toLowerCase();

    if (authMode === "login") {
      const user = data.users.find(
        (item) => item.email.toLowerCase() === email && item.password === authForm.password
      );

      if (!user) {
        setToast("Correo o contraseña incorrectos");
        return;
      }

      if (user.suspended) {
        setToast("Este usuario está suspendido");
        return;
      }

      setCurrentUserId(user.id);
      setShowAuth(false);
      notify(`Bienvenido, ${user.name}`, "Cuenta");
      return;
    }

    if (!email.endsWith("@unisabana.edu.co")) {
      setToast("Usa un correo institucional @unisabana.edu.co");
      return;
    }

    if (data.users.some((user) => user.email.toLowerCase() === email)) {
      setToast("Ese correo ya está registrado");
      return;
    }

    const newUser = {
      id: Date.now(),
      name: authForm.name.trim() || "Usuario Sabana",
      email,
      password: authForm.password || "123456",
      career: authForm.career.trim(),
      role: authForm.role,
      avatar: getInitials(authForm.name),
      reputation: 0,
      suspended: false,
    };

    updateData((prev) => ({ ...prev, users: [...prev.users, newUser] }));
    setCurrentUserId(newUser.id);
    setShowAuth(false);
    notify("Cuenta creada correctamente", "Cuenta");
  }

  function addToCart(productId) {
    if (!currentUser) return;

    updateData((prev) => {
      const exists = prev.cart.find((item) => item.userId === currentUser.id && item.productId === productId);
      if (exists) {
        return {
          ...prev,
          cart: prev.cart.map((item) =>
            item.userId === currentUser.id && item.productId === productId
              ? { ...item, qty: item.qty + 1 }
              : item
          ),
        };
      }
      return {
        ...prev,
        cart: [...prev.cart, { id: Date.now(), userId: currentUser.id, productId, qty: 1 }],
      };
    });

    notify("Producto agregado al carrito", "Compra");
  }

  function removeFromCart(productId) {
    updateData((prev) => ({
      ...prev,
      cart: prev.cart.filter((item) => !(item.userId === currentUser.id && item.productId === productId)),
    }));
  }

  function confirmPurchase() {
    if (!cartItems.length) {
      setToast("El carrito está vacío");
      return;
    }

    const newOrder = {
      id: Date.now(),
      buyerId: currentUser.id,
      status: "Confirmada",
      total: cartTotal,
      date: new Date().toLocaleDateString("es-CO"),
      items: cartItems.map((item) => ({ productId: item.productId, qty: item.qty, price: item.product.price })),
    };

    updateData((prev) => ({
      ...prev,
      orders: [newOrder, ...prev.orders],
      cart: prev.cart.filter((item) => item.userId !== currentUser.id),
      products: prev.products.map((product) => {
        const purchased = cartItems.find((item) => item.productId === product.id);
        if (!purchased) return product;
        return { ...product, stock: Math.max(0, product.stock - purchased.qty) };
      }),
    }));

    notify("Compra confirmada. Revisa tu historial.", "Orden");
    setActivePage("ordenes");
  }

  function publishProduct(event) {
    event.preventDefault();

    if (!productForm.title || !productForm.price || !productForm.description) {
      setToast("Completa título, descripción y precio");
      return;
    }

    const newProduct = {
      id: Date.now(),
      title: productForm.title.trim(),
      description: productForm.description.trim(),
      price: Number(productForm.price),
      category: productForm.category,
      condition: productForm.condition,
      image:
        productForm.image.trim() ||
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
      sellerId: currentUser.id,
      stock: Number(productForm.stock || 1),
      active: true,
      featured: false,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    updateData((prev) => ({
      ...prev,
      products: [newProduct, ...prev.products],
      users: prev.users.map((user) =>
        user.id === currentUser.id && user.role === "comprador" ? { ...user, role: "vendedor" } : user
      ),
    }));

    setProductForm({
      title: "",
      description: "",
      price: "",
      category: "Tecnología",
      condition: "Nuevo",
      image: "",
      stock: "1",
    });
    notify("Producto publicado correctamente", "Producto");
    setActivePage("mis-productos");
  }

  function deleteProduct(productId) {
    updateData((prev) => ({
      ...prev,
      products: prev.products.map((product) =>
        product.id === productId ? { ...product, active: false } : product
      ),
    }));
    notify("Producto eliminado", "Moderación");
  }

  function toggleSuspendUser(userId) {
    updateData((prev) => ({
      ...prev,
      users: prev.users.map((user) =>
        user.id === userId ? { ...user, suspended: !user.suspended } : user
      ),
    }));
    notify("Estado del usuario actualizado", "Admin");
  }

  function sendMessage(product) {
    if (!messageText.trim()) return;
    if (product.sellerId === currentUser.id) {
      setToast("No puedes enviarte mensajes a ti mismo");
      return;
    }

    const newMessage = {
      id: Date.now(),
      productId: product.id,
      from: currentUser.id,
      to: product.sellerId,
      text: messageText.trim(),
      date: "Ahora",
    };

    updateData((prev) => ({ ...prev, messages: [...prev.messages, newMessage] }));
    setMessageText("");
    notify("Mensaje enviado al vendedor", "Chat");
  }

  function saveProfile(event) {
    event.preventDefault();

    const email = profileForm.email.trim().toLowerCase();
    if (!email.endsWith("@unisabana.edu.co")) {
      setToast("El correo debe ser institucional @unisabana.edu.co");
      return;
    }

    const emailInUse = data.users.some(
      (user) => user.id !== currentUser.id && user.email.toLowerCase() === email
    );

    if (emailInUse) {
      setToast("Ese correo ya está en uso por otro usuario");
      return;
    }

    updateData((prev) => ({
      ...prev,
      users: prev.users.map((user) =>
        user.id === currentUser.id
          ? {
              ...user,
              name: profileForm.name.trim() || user.name,
              email,
              password: profileForm.password || user.password,
              career: profileForm.career.trim(),
              role: profileForm.role,
              avatar: getInitials(profileForm.name.trim() || user.name),
            }
          : user
      ),
    }));

    notify("Perfil actualizado correctamente", "Perfil");
  }

  function submitReview(event) {
    event.preventDefault();
    if (!reviewForm.sellerId || !reviewForm.comment.trim()) {
      setToast("Selecciona vendedor y escribe un comentario");
      return;
    }

    const sellerId = Number(reviewForm.sellerId);
    const canReview = data.orders.some((order) =>
      order.buyerId === currentUser.id &&
      order.items.some((item) => data.products.find((p) => p.id === item.productId)?.sellerId === sellerId)
    );

    if (!canReview) {
      setToast("Solo puedes reseñar vendedores a los que compraste");
      return;
    }

    const newReview = {
      id: Date.now(),
      sellerId,
      buyerId: currentUser.id,
      rating: Number(reviewForm.rating),
      comment: reviewForm.comment.trim(),
    };

    updateData((prev) => {
      const reviews = [newReview, ...prev.reviews];
      return {
        ...prev,
        reviews,
        users: prev.users.map((user) => {
          if (user.id !== sellerId) return user;
          const sellerReviews = reviews.filter((review) => review.sellerId === sellerId);
          const average = sellerReviews.reduce((sum, review) => sum + review.rating, 0) / sellerReviews.length;
          return { ...user, reputation: Number(average.toFixed(1)) };
        }),
      };
    });

    setReviewForm({ sellerId: "", rating: 5, comment: "" });
    notify("Reseña publicada", "Reseña");
  }

  function markNotificationsRead() {
    updateData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notification) => ({ ...notification, read: true })),
    }));
  }

  function resetDemo() {
    localStorage.removeItem(STORAGE_KEY);
    setData(loadData());
    setCurrentUserId(null);
    setToast("Demo reiniciada");
  }

  function sellerOf(product) {
    return data.users.find((user) => user.id === product.sellerId) || { name: "Vendedor", reputation: 0 };
  }

  const reviewableSellers = useMemo(() => {
    const ids = new Set();
    myOrders.forEach((order) => {
      order.items.forEach((item) => {
        const product = data.products.find((p) => p.id === item.productId);
        if (product) ids.add(product.sellerId);
      });
    });
    return data.users.filter((user) => ids.has(user.id));
  }, [myOrders, data.products, data.users]);

  if (!currentUser) {
    return (
      <div className="login-page">
        <style>{styles}</style>
        {toast && <div className="toast">{toast}</div>}

        <section className="login-card">
          <div className="login-left">
            <div className="brand login-brand">
              <div className="brand-mark logo-mark">
            <img src="/la_sabana.jpg" alt="Logo Universidad de La Sabana" />
          </div>
              <div>
                <strong>Marketplace</strong>
                <span>Universidad de La Sabana</span>
              </div>
            </div>

            <span className="eyebrow">Acceso institucional</span>
            <h1>Inicia sesión para comprar, vender y chatear.</h1>
            <p>
              Plataforma tipo marketplace para estudiantes: productos, carrito, órdenes, reseñas,
              notificaciones y administración básica.
            </p>

            <div className="login-features">
              <span>✓ Gestión de productos</span>
              <span>✓ Flujo de compra simulado</span>
              <span>✓ Chat y notificaciones</span>
              <span>✓ Panel administrador</span>
            </div>
          </div>

          <div className="login-right">
            <div className="auth-switch">
              <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Iniciar sesión</button>
              <button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Registrarse</button>
            </div>

            <form className="form-grid single" onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <>
                  <label>
                    Nombre
                    <input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Tu nombre" />
                  </label>
                  <label>
                    Carrera
                    <input value={authForm.career} onChange={(e) => setAuthForm({ ...authForm, career: e.target.value })} placeholder="Ej: Ingeniería" />
                  </label>
                  <label>
                    Rol inicial
                    <select value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}>
                      <option value="comprador">Comprador</option>
                      <option value="vendedor">Vendedor</option>
                    </select>
                  </label>
                </>
              )}

              <label>
                Correo institucional
                <input value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="usuario@unisabana.edu.co" />
              </label>
              <label>
                Contraseña
                <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="Contraseña" />
              </label>

              <button className="primary full" type="submit">
                {authMode === "login" ? "Entrar al marketplace" : "Crear cuenta"}
              </button>
            </form>

            <div className="demo-users">
              <strong>Usuarios de prueba</strong>
              <button type="button" className="outline" onClick={() => { setAuthMode("login"); setAuthForm({ ...authForm, email: "admin@unisabana.edu.co", password: "admin123" }); }}>Admin</button>
              <button type="button" className="outline" onClick={() => { setAuthMode("login"); setAuthForm({ ...authForm, email: "laura@unisabana.edu.co", password: "123456" }); }}>Vendedora Laura</button>
              <button type="button" className="outline" onClick={() => { setAuthMode("login"); setAuthForm({ ...authForm, email: "carlos@unisabana.edu.co", password: "123456" }); }}>Vendedor Carlos</button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <style>{styles}</style>

      {toast && <div className="toast">{toast}</div>}

      <header className="topbar">
        <div className="brand" onClick={() => setActivePage("inicio")}>
          <div className="brand-mark logo-mark">
            <img src="/la_sabana.jpg" alt="Logo Universidad de La Sabana" />
          </div>
          <div>
            <strong>Marketplace</strong>
            <span>Universidad de La Sabana</span>
          </div>
        </div>

        <nav className="nav-links">
          <button className={activePage === "inicio" ? "active" : ""} onClick={() => setActivePage("inicio")}>Inicio</button>
          <button className={activePage === "publicar" ? "active" : ""} onClick={() => setActivePage("publicar")}>Publicar</button>
          <button className={activePage === "carrito" ? "active" : ""} onClick={() => setActivePage("carrito")}>Carrito {cartItems.length > 0 && <b>{cartItems.length}</b>}</button>
          <button className={activePage === "ordenes" ? "active" : ""} onClick={() => setActivePage("ordenes")}>Órdenes</button>
          <button className={activePage === "perfil" ? "active" : ""} onClick={() => setActivePage("perfil")}>Perfil</button>
          <button className={activePage === "notificaciones" ? "active" : ""} onClick={() => setActivePage("notificaciones")}>Notificaciones {unreadCount > 0 && <b>{unreadCount}</b>}</button>
          {currentUser.role === "admin" && (
            <button className={activePage === "admin" ? "active" : ""} onClick={() => setActivePage("admin")}>Admin</button>
          )}
        </nav>

        <div className="account-box">
          <div className="avatar">{currentUser.avatar || getInitials(currentUser.name)}</div>
          <div className="account-text">
            <strong>{currentUser.name}</strong>
            <span>{currentUser.role}</span>
          </div>
          <button className="outline small" onClick={() => setCurrentUserId(null)}>Salir</button>
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
                <button className="primary" onClick={() => setActivePage("publicar")}>Publicar producto</button>
                <button className="secondary" onClick={() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })}>Ver catálogo</button>
              </div>
            </div>

            <div className="hero-card">
              <div className="metric-grid">
                <div>
                  <strong>{activeProducts}</strong>
                  <span>Productos activos</span>
                </div>
                <div>
                  <strong>{data.users.length}</strong>
                  <span>Usuarios</span>
                </div>
                <div>
                  <strong>{data.orders.length}</strong>
                  <span>Órdenes</span>
                </div>
                <div>
                  <strong>{data.reviews.length}</strong>
                  <span>Reseñas</span>
                </div>
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
            <p>{visibleProducts.length} resultado(s)</p>
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
              <label>
                Título
                <input value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} placeholder="Ej: Libro de cálculo" />
              </label>
              <label>
                Precio
                <input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="Ej: 85000" />
              </label>
              <label>
                Categoría
                <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
                  {categories.filter((item) => item !== "Todos").map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                Estado
                <select value={productForm.condition} onChange={(e) => setProductForm({ ...productForm, condition: e.target.value })}>
                  <option>Nuevo</option>
                  <option>Usado</option>
                </select>
              </label>
              <label>
                Stock
                <input type="number" min="1" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
              </label>
              <label>
                URL de imagen
                <input value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} placeholder="Opcional: pega una URL de imagen" />
              </label>
              <label className="full">
                Descripción
                <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="Describe el estado, entrega y detalles del producto" />
              </label>
              <button className="primary full" type="submit">Publicar ahora</button>
            </form>
          </section>

          <section className="panel">
            <span className="eyebrow">Mis ventas</span>
            <h2>Mis productos</h2>
            {sellerProducts.length === 0 ? (
              <p className="muted">Todavía no tienes productos publicados.</p>
            ) : (
              <div className="list-stack">
                {sellerProducts.map((product) => (
                  <div className="mini-item" key={product.id}>
                    <img src={product.image} alt={product.title} />
                    <div>
                      <strong>{product.title}</strong>
                      <span>{money(product.price)} · {product.condition}</span>
                    </div>
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
                <div>
                  <strong>{product.title}</strong>
                  <span>{money(product.price)} · Stock {product.stock}</span>
                </div>
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
            {cartItems.length === 0 ? (
              <p className="muted">Tu carrito está vacío.</p>
            ) : (
              <div className="list-stack">
                {cartItems.map((item) => (
                  <div className="mini-item" key={item.id}>
                    <img src={item.product.image} alt={item.product.title} />
                    <div>
                      <strong>{item.product.title}</strong>
                      <span>{money(item.product.price)} · Cantidad {item.qty}</span>
                    </div>
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
            {myOrders.length === 0 ? (
              <p className="muted">Aún no tienes compras.</p>
            ) : (
              <div className="list-stack">
                {myOrders.map((order) => (
                  <div className="order-card" key={order.id}>
                    <div>
                      <strong>Orden #{String(order.id).slice(-6)}</strong>
                      <span>{order.date} · {order.status}</span>
                    </div>
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
              <label>
                Vendedor
                <select value={reviewForm.sellerId} onChange={(e) => setReviewForm({ ...reviewForm, sellerId: e.target.value })}>
                  <option value="">Selecciona...</option>
                  {reviewableSellers.map((seller) => <option value={seller.id} key={seller.id}>{seller.name}</option>)}
                </select>
              </label>
              <label>
                Rating
                <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}>
                  <option value="5">5 - Excelente</option>
                  <option value="4">4 - Bueno</option>
                  <option value="3">3 - Normal</option>
                  <option value="2">2 - Regular</option>
                  <option value="1">1 - Malo</option>
                </select>
              </label>
              <label className="full">
                Comentario
                <textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Escribe tu experiencia" />
              </label>
              <button className="primary full">Enviar reseña</button>
            </form>
          </section>
        </main>
      )}

      {activePage === "perfil" && (
        <main className="page-grid">
          <section className="panel form-panel">
            <span className="eyebrow">Mi cuenta</span>
            <h2>Modificar perfil</h2>
            <p className="muted">
              Actualiza tus datos personales y cambia tu rol entre comprador y vendedor.
            </p>

            <form onSubmit={saveProfile} className="form-grid">
              <label>
                Nombre
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Tu nombre completo"
                />
              </label>

              <label>
                Carrera
                <input
                  value={profileForm.career}
                  onChange={(e) => setProfileForm({ ...profileForm, career: e.target.value })}
                  placeholder="Ej: Ingeniería, Medicina, Economía"
                />
              </label>

              <label>
                Correo institucional
                <input
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="usuario@unisabana.edu.co"
                />
              </label>

              <label>
                Contraseña
                <input
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                  placeholder="Nueva contraseña"
                />
              </label>

              <label className="full">
                Rol
                <select
                  value={profileForm.role}
                  onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                >
                  <option value="comprador">Comprador</option>
                  <option value="vendedor">Vendedor</option>
                  {currentUser.role === "admin" && <option value="admin">Administrador</option>}
                </select>
              </label>

              <button className="primary full" type="submit">Guardar cambios</button>
            </form>
          </section>

          <aside className="panel profile-preview">
            <span className="eyebrow">Vista previa</span>
            <div className="profile-avatar">{getInitials(profileForm.name || currentUser.name)}</div>
            <h2>{profileForm.name || currentUser.name}</h2>
            <p className="muted">{profileForm.email}</p>
            <div className="profile-info">
              <div>
                <strong>{profileForm.role}</strong>
                <span>Rol actual</span>
              </div>
              <div>
                <strong>{profileForm.career || "Sin carrera"}</strong>
                <span>Carrera</span>
              </div>
              <div>
                <strong>⭐ {currentUser.reputation || "Nuevo"}</strong>
                <span>Reputación</span>
              </div>
              <div>
                <strong>{sellerProducts.length}</strong>
                <span>Productos publicados</span>
              </div>
            </div>
          </aside>
        </main>
      )}

      {activePage === "notificaciones" && (
        <main className="panel page-only">
          <div className="section-row">
            <div>
              <span className="eyebrow">Centro de actividad</span>
              <h2>Notificaciones</h2>
            </div>
            <button className="outline" onClick={markNotificationsRead}>Marcar como leídas</button>
          </div>
          <div className="list-stack">
            {data.notifications.map((notification) => (
              <div className={`notification ${notification.read ? "read" : ""}`} key={notification.id}>
                <span>{notification.type}</span>
                <strong>{notification.text}</strong>
              </div>
            ))}
          </div>
        </main>
      )}

      {activePage === "admin" && currentUser.role === "admin" && (
        <main className="page-grid admin-grid">
          <section className="panel">
            <span className="eyebrow">Dashboard</span>
            <h2>Panel de administrador</h2>
            <div className="metric-grid admin-metrics">
              <div><strong>{data.users.length}</strong><span>Usuarios registrados</span></div>
              <div><strong>{activeProducts}</strong><span>Productos activos</span></div>
              <div><strong>{data.orders.length}</strong><span>Órdenes</span></div>
              <div><strong>{data.messages.length}</strong><span>Mensajes</span></div>
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
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.email} · {user.role}</span>
                  </div>
                  {user.role !== "admin" && (
                    <button className={user.suspended ? "primary" : "danger"} onClick={() => toggleSuspendUser(user.id)}>
                      {user.suspended ? "Activar" : "Suspender"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="panel full-panel">
            <span className="eyebrow">Moderación</span>
            <h2>Productos publicados</h2>
            <div className="list-stack">
              {data.products.filter((p) => p.active).map((product) => (
                <div className="mini-item" key={product.id}>
                  <img src={product.image} alt={product.title} />
                  <div>
                    <strong>{product.title}</strong>
                    <span>{sellerOf(product).name} · {money(product.price)}</span>
                  </div>
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
                <div>
                  <strong>{sellerOf(selectedProduct).name}</strong>
                  <span>Reputación ⭐ {sellerOf(selectedProduct).reputation || "Nuevo"}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button className="primary" onClick={() => addToCart(selectedProduct.id)}>Agregar al carrito</button>
                <button className="outline" onClick={() => setSelectedProduct(null)}>Cerrar</button>
              </div>

              <div className="chat-box">
                <h3>Chat con vendedor</h3>
                <div className="messages">
                  {data.messages
                    .filter((message) => message.productId === selectedProduct.id)
                    .slice(-4)
                    .map((message) => (
                      <div className={`message ${message.from === currentUser.id ? "mine" : ""}`} key={message.id}>
                        <span>{data.users.find((user) => user.id === message.from)?.name || "Usuario"}</span>
                        <p>{message.text}</p>
                      </div>
                    ))}
                </div>
                <div className="message-input">
                  <input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Escribe un mensaje" />
                  <button className="primary" onClick={() => sendMessage(selectedProduct)}>Enviar</button>
                </div>
              </div>

              <div className="reviews-box">
                <h3>Reseñas del vendedor</h3>
                {data.reviews.filter((review) => review.sellerId === selectedProduct.sellerId).length === 0 ? (
                  <p className="muted">Este vendedor aún no tiene reseñas.</p>
                ) : (
                  data.reviews
                    .filter((review) => review.sellerId === selectedProduct.sellerId)
                    .map((review) => (
                      <div className="review" key={review.id}>
                        <strong>{"⭐".repeat(review.rating)}</strong>
                        <p>{review.comment}</p>
                      </div>
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
              <div className="brand-mark logo-mark">
            <img src="/la_sabana.jpg" alt="Logo Universidad de La Sabana" />
          </div>
              <div>
                <strong>{authMode === "login" ? "Iniciar sesión" : "Crear cuenta"}</strong>
                <span>Correo institucional</span>
              </div>
            </div>

            <div className="auth-switch">
              <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Login</button>
              <button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Registro</button>
            </div>

            <form className="form-grid single" onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <>
                  <label>
                    Nombre
                    <input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Tu nombre" />
                  </label>
                  <label>
                    Carrera
                    <input value={authForm.career} onChange={(e) => setAuthForm({ ...authForm, career: e.target.value })} placeholder="Ej: Ingeniería" />
                  </label>
                  <label>
                    Rol inicial
                    <select value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}>
                      <option value="comprador">Comprador</option>
                      <option value="vendedor">Vendedor</option>
                    </select>
                  </label>
                </>
              )}
              <label>
                Correo
                <input value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="usuario@unisabana.edu.co" />
              </label>
              <label>
                Contraseña
                <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="Contraseña" />
              </label>
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
  width: 56px;
  height: 56px;
  color: white;
  font-weight: 900;
  letter-spacing: -0.06em;
  border-radius: 18px;
  background: white;
  border: 2px solid rgba(202, 166, 75, 0.75);
  box-shadow: 0 10px 25px rgba(7, 31, 69, 0.25);
  overflow: hidden;
}

.brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px;
  border-radius: 14px;
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

.profile-preview {
  height: fit-content;
  text-align: center;
  position: sticky;
  top: 96px;
}

.profile-avatar {
  display: grid;
  place-items: center;
  width: 110px;
  height: 110px;
  margin: 10px auto 14px;
  color: white;
  font-size: 2.2rem;
  font-weight: 950;
  border-radius: 34px;
  background: linear-gradient(135deg, var(--blue), var(--gold));
  box-shadow: 0 18px 35px rgba(7, 31, 69, 0.22);
}

.profile-info {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.profile-info div {
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #fbfcff;
}

.profile-info strong,
.profile-info span {
  display: block;
}

.profile-info strong {
  color: var(--blue);
}

.profile-info span {
  color: var(--muted);
  font-size: 0.86rem;
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

.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
  background:
    radial-gradient(circle at top left, rgba(244, 215, 125, 0.28), transparent 32%),
    linear-gradient(135deg, #071f45, #0d356d 58%, #caa64b);
}

.login-card {
  width: min(1080px, 100%);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  overflow: hidden;
  background: white;
  border-radius: 34px;
  box-shadow: 0 35px 90px rgba(0, 0, 0, 0.28);
}

.login-left {
  padding: 42px;
  color: white;
  background:
    linear-gradient(rgba(7, 31, 69, 0.88), rgba(7, 31, 69, 0.9)),
    url("https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1100&q=80") center/cover;
}

.login-left h1 {
  margin: 18px 0 14px;
  font-size: clamp(2.1rem, 5vw, 4rem);
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.login-left p {
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.7;
}

.login-brand {
  margin-bottom: 64px;
}

.login-brand span,
.login-brand strong {
  color: white;
}

.login-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 28px;
}

.login-features span {
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-weight: 800;
}

.login-right {
  padding: 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-right .demo-users button {
  width: 100%;
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
  .login-card {
    grid-template-columns: 1fr;
  }

  .login-left {
    padding: 28px;
  }

  .login-brand {
    margin-bottom: 36px;
  }

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
  .login-page {
    padding: 12px;
  }

  .login-left,
  .login-right {
    padding: 22px;
  }

  .login-features {
    grid-template-columns: 1fr;
  }

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
