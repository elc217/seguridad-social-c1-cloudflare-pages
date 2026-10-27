# 🎨 Generador de Aplicaciones de Leyes

Herramienta para crear aplicaciones de estudio de leyes con personalización completa de colores y contenido.

## 🚀 Inicio Rápido

```bash
cd generador-leyes
npm install
npm start
```

Abrir http://localhost:3000

## ✨ Características

- **Personalización de colores**: Define tu propia paleta de colores
- **Contenido flexible**: Añade tu propio contenido en formato JSON
- **Vista previa en tiempo real**: Visualiza cómo quedará tu aplicación antes de generarla
- **Estructura completa**: Genera un proyecto listo para usar con:
  - HTML/CSS/JavaScript
  - Servidor local
  - Sistema de navegación
  - Paneles y estilos personalizados

## 🎨 Uso

1. **Información de la aplicación**:
   - Nombre de la aplicación
   - Descripción breve

2. **Personalización de colores**:
   - Color primario (para acentos y botones)
   - Color de fondo
   - Color de texto
   - Color de bordes

3. **Contenido**:
   - Usa las plantillas (Básica o Ejemplo Completo)
   - O escribe tu propio JSON con la estructura de la ley

4. **Generar**:
   - Haz clic en "Generar Proyecto"
   - Descarga el ZIP generado
   - Descomprime y ejecuta `npm install && npm start`

## 📁 Estructura del Proyecto Generado

```
mi-ley-proyecto/
├── index.html          # Página principal con colores personalizados
├── styles.css          # Estilos con tu paleta de colores
├── package.json        # Dependencias y scripts
├── README.md           # Documentación
├── src/
│   ├── app.js         # Lógica principal
│   ├── domain.js      # Dominio de la aplicación
│   └── corpus-loader.js # Cargador de contenido
├── data/
│   └── corpus.json    # Tu contenido de la ley
├── assets/
│   └── libro.svg      # Icono de la aplicación
└── scripts/
    └── serve.mjs      # Servidor local
```

## 📚 Formato del Contenido JSON

El contenido debe seguir esta estructura:

```json
{
  "units": [
    {
      "id": "1",
      "label": "Título I",
      "content": "Contenido del título...",
      "sections": [
        {
          "id": "1.1",
          "label": "Capítulo I",
          "content": "Contenido del capítulo..."
        }
      ]
    }
  ]
}
```

### Campos

- `units`: Array de unidades (títulos, capítulos, artículos)
- `id`: Identificador único
- `label`: Nombre visible de la unidad
- `content`: Texto del contenido
- `sections` (opcional): Subdivisiones de la unidad

## 🎯 Plantillas Incluidas

### Plantilla Básica
Estructura mínima con una unidad para empezar rápidamente.

### Ejemplo Completo
Estructura más elaborada con múltiples unidades y subdivisiones, ideal como referencia.

## 🌈 Colores Sugeridos

### Tema Azul (Seguridad Social)
- Primario: #125B95
- Fondo: #F5F9FC
- Texto: #12304A
- Bordes: #738CA2

### Tema Verde
- Primario: #146342
- Fondo: #F0F9F4
- Texto: #0A2E1D
- Bordes: #4A7C5E

### Tema Rojo
- Primario: #A12C2C
- Fondo: #FCF5F5
- Texto: #4A0E0E
- Bordes: #7C4A4A

### Tema Púrpura
- Primario: #6B21A8
- Fondo: #F9F5FC
- Texto: #3D0F63
- Bordes: #8B5FB0

## 🔧 Personalización Avanzada

Después de generar el proyecto, puedes:

1. **Modificar estilos**: Edita `styles.css` para ajustar detalles
2. **Añadir funcionalidad**: Extiende `src/app.js` con nuevas características
3. **Integrar Capacitor**: Para generar versiones móviles
4. **Integrar Electron**: Para versiones de escritorio

## 📦 Compatibilidad

El proyecto generado es:
- ✅ HTML5/CSS3/JavaScript vanilla (sin frameworks)
- ✅ Compatible con todos los navegadores modernos
- ✅ Fácil de integrar con Capacitor o Electron
- ✅ Responsive (móvil y escritorio)

## 🚀 Próximos Pasos

Después de generar tu proyecto:

1. Descomprime el ZIP
2. `cd mi-ley-proyecto`
3. `npm install`
4. `npm start`
5. Abre http://127.0.0.1:8766

## 🤝 Contribuir

Este generador está basado en la aplicación de Seguridad Social C1. Puedes usarla como base para cualquier ley o normativa.

## 📄 Licencia

MIT - Siéntete libre de usar este generador para cualquier proyecto.
