const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const users = [
  {
    id: 1,
    nombre: "Admin",
    email: "admin@unisabana.edu.co",
    password: "1234",
    role: "admin"
  },
  {
    id: 2,
    nombre: "Vendedor",
    email: "vendedor@unisabana.edu.co",
    password: "1234",
    role: "vendedor"
  },
  {
    id: 3,
    nombre: "Comprador",
    email: "comprador@unisabana.edu.co",
    password: "1234",
    role: "comprador"
  }
];

const products = [];

app.get("/", (req, res) => {
  res.send("TRD Marketplace Backend funcionando");
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email y password obligatorios"
    });
  }

  if (!email.endsWith("@unisabana.edu.co")) {
    return res.status(403).json({
      message: "Solo se permite correo institucional"
    });
  }

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      message: "Credenciales inválidas"
    });
  }

  return res.status(200).json({
    message: "Login exitoso",
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      role: user.role
    }
  });
});

app.post("/api/auth/register", (req, res) => {
  const { nombre, email, password, role } = req.body;

  if (!nombre || !email || !password || !role) {
    return res.status(400).json({
      message: "Todos los campos son obligatorios"
    });
  }

  if (!email.endsWith("@unisabana.edu.co")) {
    return res.status(403).json({
      message: "Debe usar correo institucional"
    });
  }

  const existingUser = users.find((u) => u.email === email);

  if (existingUser) {
    return res.status(409).json({
      message: "El usuario ya existe"
    });
  }

  const newUser = {
    id: users.length + 1,
    nombre,
    email,
    password,
    role
  };

  users.push(newUser);

  return res.status(201).json({
    message: "Usuario registrado exitosamente",
    user: newUser
  });
});

app.post("/api/products", (req, res) => {
  const { nombre, descripcion, precio } = req.body;

  if (!nombre || !descripcion || !precio) {
    return res.status(400).json({
      message: "Todos los campos son obligatorios"
    });
  }

  const newProduct = {
    id: products.length + 1,
    nombre,
    descripcion,
    precio
  };

  products.push(newProduct);

  return res.status(201).json({
    message: "Producto creado correctamente",
    product: newProduct
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
