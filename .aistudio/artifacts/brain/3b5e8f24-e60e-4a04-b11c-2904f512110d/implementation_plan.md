# Bonpreu Esclat Vales Wallet (Monedero Familiar de Descuentos)

Una aplicación web móvil progresiva (PWA-ready) diseñada para gestionar, organizar y canjear con agilidad en caja todos tus vales de descuento de Bonpreu y Esclat, con escaneo inteligente de tiques, códigos de barras de alta legibilidad, alertas de caducidad y sincronización en la nube para toda la familia.

### Decisiones Críticas y Resumen de Preferencias

> [!IMPORTANT]
> **Preferencias confirmadas por el usuario:**
> - **Método de registro**: Formulario ágil asistido por IA (escaneo con cámara/foto de tiques Bonpreu mediante `gemini-3.8-flash` para extracción automática de importe, fechas y condiciones) más entrada manual rápida.
> - **Almacenamiento y sincronización**: Sincronización en la nube con Firebase Firestore para compartir el monedero de vales en familia (mediante código de hogar/familia compartido), con caché offline en `localStorage` para garantizar acceso instantáneo incluso sin cobertura dentro del supermercado.
> - **Herramientas para caja**: Códigos de barras visuales nítidos listos para escanear con la pistola o lector de caja, alertas de caducidad inminente (ordenación por urgencia), calculadora de ahorro total y filtros por secciones de tienda (Carnicería, Pescadería, Compra General, etc.).

---

## 1. Concepto y Experiencia de Usuario

### Propósito y Valor Principal
Los clientes de Bonpreu y Esclat acumulan múltiples vales impresos en tiques de compra o promociones que frecuentemente se olvidan en bolsos, coches o se traspapelan y caducan antes de ser utilizados. Esta app convierte el teléfono en un monedero digital de vales optimizado para la experiencia de compra:
- **Cero pérdidas por caducidad**: Visibilidad inmediata de qué vales vencen en las próximas 48h o esta semana.
- **Rapidez en la cola de caja**: Abrir el vale, mostrar el código de barras con brillo óptimo y marcarlo como "Canjeado" con un toque.
- **Ahorro familiar unificado**: Toda la familia sabe qué vales están disponibles para no duplicar compras ni perder descuentos por compra mínima.

---

## 2. Experiencia de Usuario y Diseño Visual

### Identidad Visual y Paleta (Inspirada en el universo Bonpreu Esclat)
- **Alineación con la marca**:
  - Color Primario: Rojo corporativo Bonpreu (`#E30613` / Tailwind `red-600` - `red-700`).
  - Color Secundario / Acento: Naranja/Ámbar cálido para promociones y ahorro (`#F58220` / `amber-500`).
  - Fondos y Superficies: Blanco puro (`#FFFFFF`) y gris neutro suave (`#F8FAFC` / `slate-50`), con bordes sutiles de 1px (`slate-200`) y tarjetas con radio `rounded-2xl`.
  - Estados Semánticos:
    - Urgente / Caduca hoy o mañana: Rojo vivo (`text-red-600`, `bg-red-50`).
    - Próximo a vencer (2-5 días): Ámbar (`text-amber-700`, `bg-amber-50`).
    - Válido / Holgado: Esmeralda sobrio (`text-emerald-700`, `bg-emerald-50`).
- **Tipografía**:
  - Titulares y números de descuento: *Plus Jakarta Sans* (pesos 600 y 700) para impacto y claridad en importes (`5,00 €`, `-20%`).
  - Textos y condiciones: *DM Sans* o sistema neo-grotesco de alta legibilidad en pantallas móviles bajo luz de supermercado.
  - Códigos de barras y números de vale: Monospace tabular (`font-mono tabular-nums`).
- **Ergonomía Táctil y Zona del Pulgar**:
  - Barra de navegación inferior fija (`fixed bottom-0`) con 4 accesos directos: **Vales Activos**, **Añadir / Escanear**, **Calculadora / Secciones**, y **Familia / Ajustes**.
  - Botón principal de acción ("Añadir Vale") destacado en la zona accesible con una sola mano.
  - Hitbox táctil mínima de 48px para todos los botones de canje y filtros.

---

## 3. Arquitectura del Sistema y Flujo de Datos

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INTERFAZ MÓVIL (PWA)                            │
│                                                                        │
│  ┌───────────────────────┐  ┌────────────────────┐  ┌───────────────┐ │
│  │   Lista de Vales      │  │  Escáner / Cámara  │  │ Modo Caja /   │ │
│  │   (Filtros & Estados) │  │  (Foto OCR Gemini) │  │ Código Barras │ │
│  └───────────┬───────────┘  └─────────┬──────────┘  └───────┬───────┘ │
└──────────────┼────────────────────────┼─────────────────────┼─────────┘
               │                        │                     │
               ▼                        ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      CAPA DE GESTIÓN Y ESTADO                          │
│                                                                        │
│  - useCouponsStore (Estado reactivo con ordenación por urgencia)       │
│  - Offline Cache (localStorage de rescate para compras sin cobertura)  │
│  - Generador SVG de Código de Barras (CODE128 / EAN13)                 │
└──────────────────┬────────────────────────────┬────────────────────────┘
                   │                            │
                   ▼                            ▼
┌──────────────────────────────────────┐ ┌───────────────────────────────┐
│           FIREBASE CLOUD             │ │       API / BACKEND PROXY     │
│                                      │ │                               │
│ - Firestore: 'households/{id}/vales' │ │ - /api/scan-coupon (Gemini)   │
│ - Reglas de seguridad para familias  │ │ - Procesamiento imagen -> JSON│
└──────────────────────────────────────┘ └───────────────────────────────┘
```

### Modelo de Datos del Vale (`Coupon`)
- `id`: string único.
- `title`: Título descriptivo (ej. "5€ en compra superior a 50€", "-20% Carnicería").
- `discountType`: `'fixed'` (ej. 5.00€), `'percentage'` (ej. 20%), `'promo'` (ej. 2x1, 2a unidad -70%).
- `discountAmount`: número (5.00, 20, etc.).
- `minPurchase`: compra mínima requerida en euros (opcional, ej. 50.00).
- `section`: Sección de compra (`'general'`, `'carnisseria'`, `'peixateria'`, `'fruita'`, `'formatgeria'`, `'fleca'`, `'celler'`, `'esclatoil'`, `'altres'`).
- `expiryDate`: Fecha de caducidad (ISO string `YYYY-MM-DD`).
- `validFrom`: Fecha de inicio de validez (opcional).
- `barcode`: Código numérico o alfanumérico para generar el código de barras en caja.
- `notes`: Restricciones o condiciones especiales (ej. "Solo tiendas Esclat", "Excluye ofertas").
- `isUsed`: Booleano (marcado al pasar por caja).
- `usedAt`: Fecha de canje.
- `householdId`: Identificador del grupo familiar compartido.
- `createdBy`: Nombre del miembro de la familia.

---

## 4. Plan de Fases de Construcción

### Fase 1: Infraestructura y Sincronización en la Nube
- Configuración de Firebase Firestore para persistencia compartida mediante el flujo interactivo de AI Studio (`ui_type: "firebase_setup"`).
- Esquema de base de datos `households/{householdId}/coupons/{couponId}` con soporte offline y reglas de seguridad.
- Sistema de Código de Hogar familiar (fácil de compartir por WhatsApp o código de 6 dígitos) para sincronizar entre parejas o familias sin necesidad de contraseñas complejas.

### Fase 2: Escáner Inteligente con IA (Gemini 3.8 Flash)
- Endpoint servidor `/api/scan-coupon` que recibe la fotografía del tique o vale de Bonpreu.
- Extracción de datos estructurados vía `gemini-3.8-flash`: importe, tipo de vale, condiciones de compra mínima, sección del supermercado, fechas de validez y números del código de barras.
- Formulario de confirmación previa con edición rápida antes de guardar.

### Fase 3: Vista de Caja (Modo "A Pagar") y Códigos de Barras
- Generación de código de barras vectorial nítido en pantalla (Code 128 / EAN).
- Botón de brillo máximo temporal para facilitar la lectura del escáner óptico del cajero o lector manual.
- Acción de canje con un toque ("Marcar como Usado") con confirmación táctil y posibilidad de deshacer.

### Fase 4: Organización, Filtros por Sección y Calculadora de Ahorro
- Pestañas de filtrado: Disponibles, Urgentes (caducan en < 3 días), Por Sección (Carnicería, Pescadería, etc.) y Canjeados/Historial.
- Resumen métrico superior: Total de ahorro disponible en euros, número de vales y contador de los que caducan esta semana.
- Simulador de compra: selecciona los vales que vas a usar hoy y calcula el descuento total exacto que te aplicarán en caja.

### Fase 5: PWA y Adaptación Móvil
- Manifest de la aplicación y meta etiquetas optimizadas para iOS Safari y Android Chrome ("Añadir a pantalla de inicio").
- Estilos táctiles anti-rebote, sin zoom accidental en inputs (`text-base` en campos) y soporte para gestos.
