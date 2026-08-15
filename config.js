// ============================================================
//  CONFIGURACIÓN DEL CATÁLOGO  —  AROMELLE
//  ¡ESTE ES EL ÚNICO ARCHIVO QUE CAMBIAS PARA CADA CATÁLOGO NUEVO!
//  Rellena SOLO los valores entre comillas. No borres comillas ni comas.
// ============================================================
const CONFIG = {

  // --- Supabase (Project Settings -> API en tu proyecto) ---
  SUPABASE_URL:      "https://pyregonbsatplxgekymb.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5cmVnb25ic2F0cGx4Z2VreW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMjU0MTUsImV4cCI6MjEwMTkwMTQxNX0.RcTf2YhayD8PoSxxcTY1F8qSOogvN4fwTzRRXmKhE2g",

  // Nombre del bucket de imágenes (debe coincidir con el SQL).
  // Aromelle YA usa el bucket "aromelle": lo dejamos así para que tus
  // imágenes actuales sigan funcionando.
  BUCKET: "aromelle",

  // --- Datos de la tienda ---
  TIENDA_NOMBRE:  "Aromelle",
  TIENDA_TAGLINE: "Decants de perfumes",
  MONEDA:         "S/",

  // --- Frase debajo del nombre grande (subtítulo de bienvenida) ---
  //  (También editable desde el panel, en la pestaña "Ajustes")
  HERO_SUB: "Decants auténticos de perfumes árabes, de diseñador y nicho. Prueba antes de comprar el frasco completo.",

  // --- Mensaje de agradecimiento del comprobante impreso ---
  //  (También editable desde el panel, en la pestaña "Ajustes")
  MENSAJE_GRACIAS: "¡Gracias por tu compra! Vuelve pronto 🌸",

  // --- WhatsApp para recibir pedidos (con código de país 51, sin +) ---
  WHATSAPP: "51962367182",

  // --- Pago Yape (déjalo en "" si no lo usas) ---
  YAPE_NUMERO: "",
  YAPE_NOMBRE: "",

  // --- Texto de envío que se muestra en el producto ---
  ENVIO_TEXTO: "Envíos a todo el Perú por Shalom · costo adicional S/ 2",

  // --- Stock: umbral para mostrar "¡Últimas X!" en el catálogo ---
  STOCK_BAJO: 5,

  // --- Logo del encabezado (se ve sobre el fondo del TEMA) ---
  //  Usa tu logo.png de siempre. Vacío = se muestra el nombre en texto dorado.
  LOGO_URL: "logo.png",

  // --- Logo de la PANTALLA DE CARGA ---
  //  El fondo de la carga usa el color TEMA.bg (oscuro), así que usa un logo
  //  que se vea bien sobre fondo oscuro. Vacío = muestra el nombre de la tienda.
  LOGO_CARGA: "",

  // ============================================================
  //  TEMA (COLORES)  —  paleta oscura/dorada de Aromelle.
  // ============================================================
  TEMA: {
    "bg":        "#0a0a0d",  // fondo principal
    "bg-2":      "#101015",  // fondo secundario
    "panel":     "#14141b",  // tarjetas y paneles
    "panel-2":   "#1b1b23",  // inputs y elementos elevados
    "line":      "#2a2a33",  // bordes visibles
    "line-soft": "#1f1f27",  // bordes suaves
    "gold-1":    "#f4e6b8",  // dorado claro (brillo)
    "gold-2":    "#d9b45a",  // dorado principal (acentos, iconos)
    "gold-3":    "#b8893a",  // dorado medio
    "gold-deep": "#8a6522",  // dorado profundo (bordes, detalles)
    "cream":     "#f2ecdf",  // color del texto principal
    "muted":     "#8f8a7a",  // texto secundario
    "muted-2":   "#6a6659",  // texto terciario / apagado
  },

  // --- Redes sociales (deja "" en la que no uses) ---
  REDES: {
    instagram: "",
    facebook:  "",
    tiktok:    "https://www.tiktok.com/@aromelle.decants?_r=1&_t=ZS-98hXj8YPyOy",
  },

  // --- Opciones de filtros ---
  CATEGORIAS: ["Árabe", "Diseñador", "Nicho"],
  GENEROS:    ["Hombre", "Mujer", "Unisex"],
};
