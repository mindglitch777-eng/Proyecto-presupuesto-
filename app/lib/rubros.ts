// Rubros y artículos que se venden en un kiosco, almacén, despensa o dietética de Argentina.
// Sirve para entender "vendí 250 mil de carne, 20 mil en cerveza y 15 en cigarrillos" y "10 cocas y 5 alfajores".
// Las palabras van sin tildes y en singular (el lector también prueba sin la "s" / "es" final).

export type Rubro = { id: string; nombre: string; palabras: string[] };

export const RUBROS: Rubro[] = [
  { id: "bebidas", nombre: "Bebidas", palabras: ["bebida", "gaseosa", "coca", "cocacola", "coca cola", "pepsi", "sprite", "fanta", "seven up", "7up", "manaos", "cunnington", "agua", "agua mineral", "soda", "sifon", "jugo", "jugo en polvo", "tang", "clight", "aquarius", "levite", "cepita", "baggio", "energizante", "monster", "speed", "red bull", "gatorade", "powerade", "isotonica", "chocolatada", "botella", "botellita", "lata", "latita"] },
  { id: "alcohol", nombre: "Bebidas con alcohol", palabras: ["cerveza", "birra", "porron", "quilmes", "brahma", "stella", "heineken", "corona", "budweiser", "fernet", "branca", "vino", "tinto", "blanco", "tetra", "whisky", "vodka", "gin", "ron", "gancia", "campari", "aperitivo", "champagne", "sidra", "licor", "cinzano", "speed con vodka"] },
  { id: "cigarrillos", nombre: "Cigarrillos y tabaco", palabras: ["cigarrillo", "cigarro", "pucho", "atado", "marlboro", "philip", "philip morris", "lucky", "lucky strike", "camel", "chesterfield", "parliament", "jockey", "red point", "tabaco", "papelillo", "filtro", "encendedor", "fosforo", "bic"] },
  { id: "golosinas", nombre: "Golosinas", palabras: ["golosina", "caramelo", "chicle", "chupetin", "chocolate", "chocolatin", "alfajor", "turron", "gomita", "pastilla", "mentita", "bon o bon", "bonobon", "beldent", "topline", "mantecol", "rocklets", "tita", "rhodesia", "havanna", "jorgito", "guaymallen", "fantoche", "block", "cofler", "milka", "kinder", "huevito", "obleas", "oblea", "bananita"] },
  { id: "snacks", nombre: "Galletitas y snacks", palabras: ["galletita", "galleta", "oreo", "pepitos", "criollita", "express", "traviata", "snack", "papas fritas", "papita", "palito", "chizito", "doritos", "lays", "pehuamar", "mani", "saladix", "pepa", "bizcochito", "tostada"] },
  { id: "almacen", nombre: "Almacén", palabras: ["yerba", "mate", "azucar", "harina", "fideo", "tallarin", "arroz", "aceite", "polenta", "sal", "te", "cafe", "mate cocido", "edulcorante", "lata de tomate", "pure de tomate", "tomate en lata", "conserva", "atun", "arveja", "choclo", "lenteja", "poroto", "garbanzo", "mayonesa", "ketchup", "mostaza", "salsa", "condimento", "caldo", "sopa", "vinagre", "dulce de leche", "mermelada", "dulce", "cacao", "nesquik", "cereal", "copos", "rebozador", "pan rallado", "almacen"] },
  { id: "lacteos", nombre: "Lácteos", palabras: ["leche", "yogur", "yogurt", "queso", "quesito", "manteca", "crema", "postre", "flan", "serenisima", "sancor", "casancrem", "ricota", "lacteo"] },
  { id: "fiambreria", nombre: "Fiambrería", palabras: ["fiambre", "jamon", "salame", "salamin", "mortadela", "queso de maquina", "paleta", "bondiola", "salchicha", "pancho", "leberwurst", "picada"] },
  { id: "carniceria", nombre: "Carnicería", palabras: ["carne", "asado", "milanesa", "pollo", "pata muslo", "pechuga", "cerdo", "chorizo", "morcilla", "carne picada", "bife", "vacio", "matambre", "costilla", "nalga", "cuadrada", "peceto", "osobuco", "hamburguesa", "carniceria", "achura"] },
  { id: "panaderia", nombre: "Panadería", palabras: ["pan", "pancito", "felipe", "flauta", "factura", "medialuna", "bizcocho", "criollo", "chipa", "prepizza", "pizza", "tapa de empanada", "tapas de empanada", "torta", "budin", "pan dulce", "panaderia", "sandwich", "sanguche"] },
  { id: "verduleria", nombre: "Verdulería", palabras: ["verdura", "fruta", "papa", "batata", "tomate", "cebolla", "zanahoria", "lechuga", "zapallo", "zapallito", "morron", "ajo", "banana", "manzana", "naranja", "mandarina", "limon", "pera", "uva", "frutilla", "verduleria"] },
  { id: "huevos", nombre: "Huevos", palabras: ["huevo", "maple"] },
  { id: "limpieza", nombre: "Limpieza", palabras: ["lavandina", "detergente", "jabon en polvo", "jabon liquido", "suavizante", "limpiador", "desinfectante", "esponja", "trapo", "rejilla", "escoba", "insecticida", "raid", "bolsa de residuo", "bolsas de residuo", "papel de cocina", "rollo de cocina", "cif", "ayudin", "magistral", "skip", "ala", "limpieza"] },
  { id: "perfumeria", nombre: "Perfumería e higiene", palabras: ["shampoo", "acondicionador", "jabon", "papel higienico", "panal", "toallita", "desodorante", "pasta de dientes", "cepillo de dientes", "toalla femenina", "toallas femeninas", "afeitadora", "preservativo", "algodon", "perfumeria", "colgate", "rexona", "pampers"] },
  { id: "helados", nombre: "Helados", palabras: ["helado", "palito helado", "cucurucho", "tentacion", "frigor", "bombon helado"] },
  { id: "congelados", nombre: "Congelados", palabras: ["congelado", "empanada", "pizza congelada", "papas congeladas", "nuggets", "patitas", "rebozado"] },
  { id: "cargas", nombre: "Cargas y servicios", palabras: ["carga", "recarga", "carga virtual", "credito para el celular", "sube", "tarjeta sube", "pago de servicio", "pagofacil", "rapipago", "servicio"] },
  { id: "libreria", nombre: "Librería y fotocopias", palabras: ["cuaderno", "lapicera", "birome", "lapiz", "goma", "regla", "carpeta", "hoja", "fotocopia", "impresion", "util", "libreria", "diario", "revista"] },
  { id: "dietetica", nombre: "Dietética", palabras: ["dietetica", "frutos secos", "almendra", "nuez", "castana", "pasa de uva", "granola", "avena", "semilla", "chia", "lino", "sesamo", "harina integral", "integral", "sin tacc", "celiaco", "mix", "suelto", "legumbre", "quinoa", "proteina", "barrita", "barra de cereal", "stevia", "miel"] },
  { id: "mascotas", nombre: "Mascotas", palabras: ["alimento para perro", "alimento balanceado", "balanceado", "piedras sanitarias", "piedrita", "comida de perro", "comida de gato", "dog chow", "pedigree", "whiskas"] },
  { id: "hielo", nombre: "Hielo, carbón y leña", palabras: ["hielo", "bolsa de hielo", "carbon", "lena", "garrafa"] },
  { id: "varios", nombre: "Varios", palabras: ["pila", "cargador", "auricular", "vela", "juguete", "globo", "bazar", "regalo"] },
];

// Palabras que también son otra cosa ("vino el proveedor", "una lata", "el té"): solo cuentan después de "de", "en" o una cantidad.
const AMBIGUAS = new Set(["vino", "blanco", "tinto", "te", "sal", "mate", "lata", "latita", "botella", "botellita", "dulce", "papa", "pila", "mix", "util", "ala", "block", "express", "tita", "speed", "filtro", "goma", "regla", "hoja", "carga", "servicio", "suelto", "integral", "felipe", "flauta", "criollo", "paleta", "palito", "pancho", "torta", "pizza", "salsa", "crema", "postre", "mani", "regalo", "cerdo", "vela", "copos", "cereal", "credito para el celular"]);

const sinTildes = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
// Formas posibles en singular de una palabra dicha: "cocas" → coca, "alfajores" → alfajor, "fiambres" → fiambre, "limones" → limon.
const formas = (w: string) => {
  const f = new Set([w]);
  if (w.length > 3 && w.endsWith("s")) f.add(w.slice(0, -1));
  if (w.length > 4 && w.endsWith("es")) f.add(w.slice(0, -2));
  return f;
};

type Clave = { palabras: string[]; rubro: Rubro; ambigua: boolean; texto: string };
const CLAVES: Clave[] = RUBROS.flatMap((r) => r.palabras.map((p) => ({ palabras: p.split(" "), rubro: r, ambigua: AMBIGUAS.has(p), texto: p }))).sort((a, b) => b.palabras.length - a.palabras.length);

export type Hallazgo = { rubro: Rubro; texto: string; desde: number; hasta: number };

/** Busca artículos/rubros en una lista de palabras (ya en minúscula y sin tildes). Devuelve los hallazgos sin superponerse. */
export function buscarRubros(tokens: string[], previo = ""): Hallazgo[] {
  const t = tokens.map((x) => formas(sinTildes(x)));
  const usados = new Set<number>();
  const out: Hallazgo[] = [];
  for (const c of CLAVES) {
    const n = c.palabras.length;
    for (let i = 0; i + n <= t.length; i++) {
      if (c.palabras.some((p, k) => !t[i + k].has(p) || usados.has(i + k))) continue;
      const antes = i > 0 ? sinTildes(tokens[i - 1]) : previo;
      if (c.ambigua && !/^(de|en|del|con)$/.test(antes) && !/^\d/.test(antes) && !/^(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)$/.test(antes)) continue;
      for (let k = 0; k < n; k++) usados.add(i + k);
      out.push({ rubro: c.rubro, texto: c.texto, desde: i, hasta: i + n });
    }
  }
  return out.sort((a, b) => a.desde - b.desde);
}

export const rubroPorId = (id: string) => RUBROS.find((r) => r.id === id);
