// ============================================================
//  Configuración de la experiencia AR · Virtual eLearning
//  Edita aquí textos, colores, enlaces y datos de ejemplo.
// ============================================================
export const CONFIG = {
  brand: 'Virtual eLearning',
  tagline: 'Aprende · Conecta · Crece',

  // Botón final flotante (CTA)
  cta: {
    text: 'Solicitar demo',
    url: 'https://virtualelearning.co',   // ← cámbialo (puede ser un enlace de WhatsApp: https://wa.me/57XXXXXXXXXX)
  },

  // Imagen ancla (la tarjeta impresa) y su versión compilada para el tracking
  targetSrc: 'assets/ancla.mind',
  targetImg: 'assets/ancla.png',

  colors: { teal: '#2ee6c8', violet: '#8b6cff', navy: '#0b1330', ink: '#070b22', white: '#ffffff', muted: '#9fb0e8', green: '#4ade80' },

  sound: true,

  // Datos de ejemplo que se ven dentro del panel
  menu: [
    { id: 'cursos',      label: 'Cursos',      icon: 'book'   },
    { id: 'estudiantes', label: 'Estudiantes', icon: 'people' },
    { id: 'progreso',    label: 'Progreso',    icon: 'chart'  },
    { id: 'logros',      label: 'Logros',      icon: 'medal'  },
  ],
  courses: [
    { name: 'Matemáticas', grade: '5.º grado', pct: 72, sym: 'π',  c1: '#2ee6c8', c2: '#3b82f6' },
    { name: 'Lenguaje',    grade: '5.º grado', pct: 58, sym: 'Aa', c1: '#8b6cff', c2: '#ec4899' },
    { name: 'Ciencias',    grade: '5.º grado', pct: 85, sym: 'O₂', c1: '#4ade80', c2: '#2ee6c8' },
  ],
  students: [
    { n: 'Ana Martínez',  c: 'Matemáticas', s: 'En línea'  },
    { n: 'Luis Herrera',  c: 'Lenguaje',    s: 'Completó'  },
    { n: 'Sofía Ramírez', c: 'Ciencias',    s: 'En línea'  },
    { n: 'Diego Castro',  c: 'Matemáticas', s: 'Completó'  },
  ],
  studentsActive: 1248,
  groupProgress: 86,
  weekBars: [40, 65, 52, 80, 70, 92],
  certificate: { name: 'Ana Martínez', course: 'Matemáticas 5.º' },
};
