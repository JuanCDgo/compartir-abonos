# Manual Técnico y de Arquitectura - Gestor de Abonos Streaming

Este documento detalla la arquitectura, el modelo de datos, la lógica financiera y el mantenimiento de la aplicación web de gestión de suscripciones para Juan.

---

## 1. Arquitectura General

- **Paradigma:** Single Page Application (SPA) modular en **Vanilla JavaScript (ES6+)**, **HTML5 semántico** y **CSS3 moderno** con variables CSS.
- **Sin dependencias pesadas:** No requiere bundlers (Vite, Webpack) ni entornos de ejecución Node.js en producción. Se ejecuta de forma 100% estática y puede desplegarse directamente en **GitHub Pages**, Vercel o de manera local abriendo el archivo `index.html`.
- **Persistencia:** Almacenamiento local en cliente mediante `localStorage` bajo la clave `abonos_streaming_juan_data`. Permite portabilidad completa mediante exportación e importación en formato JSON estandarizado.

---

## 2. Esquema de Datos (`appState`)

La aplicación maneja un único árbol de estado centralizado:

```typescript
interface AppState {
  config: {
    nombreNegocio: string;       // Nombre reflejado en header y mensajes
    aliasCobro: string;          // Alias bancario / Mercado Pago (ej. 'jmg2011')
    titular: string;             // Titular de la cuenta
    logo: string;                // String base64 con la imagen optimizada
    modoRedondeo: 'exacto' | 'entero' | 'centena' | 'mil';
    mesActual: string;           // Etiqueta del ciclo de cobro (ej. 'Noviembre 2026')
  };
  servicios: Array<{
    id: string;                  // Identificador único (ej. 'disney')
    nombre: string;              // Nombre legible
    precio: number;              // Costo total mensual en ARS con impuestos incluidos
    icono: string;               // Emoji representativo
    incluyeJuan: boolean;        // Si Juan ocupa un cupo en el reparto
  }>;
  amigos: Array<{
    id: string;                  // Slug identificador
    nombre: string;              // Nombre del amigo
    telefono: string;            // Número telefónico local
    servicios: string[];         // Array de IDs de servicios asignados
    precioPersonalizado: number | null; // Sobreescritura manual (ej. $ 4.300)
    pagado: boolean;             // Estado del pago del mes en curso
    token: string;               // Token seguro para el Pase Digital público
  }>;
}
```

---

## 3. Lógica Financiera y Motor de Cálculo

### 3.1. Cuota por Servicio
La función `getCuotaServicio(servicioId)` calcula el valor por usuario dividiendo el costo total del servicio entre los amigos asignados más Juan (si tiene la bandera `incluyeJuan: true` activa):

$$\text{Cuota} = \frac{\text{Costo Total del Abono}}{\text{Amigos Asignados} + (\text{Juan} ? 1 : 0)}$$

### 3.2. Total por Amigo y Sobreescrituras
La función `calcularAmigo(amigo)` recorre los servicios asignados, calcula la cuota de cada uno aplicando el redondeo seleccionado en `config.modoRedondeo`, y genera la suma total.

Si `amigo.precioPersonalizado` tiene un valor numérico superior a 0, este reemplaza la suma automática como valor final a cobrar, preservando el desglose referencial.

### 3.3. Métricas del Administrador
- **Gasto Total Tarjetas:** $\sum \text{servicios.precio}$
- **Total a Cobrar:** $\sum \text{amigos.montoFinal}$
- **Cobrado Hasta Hoy:** $\sum_{\text{amigo.pagado}} \text{amigo.montoFinal}$
- **Costo Neto de Juan:** $\text{Gasto Total Tarjetas} - \text{Total a Cobrar}$

---

## 4. Motor de Cobro QR Robusto y Billeteras Virtuales

- **Generador Autónomo sin Dependencias Externas:** La función `renderizarQRRobusto()` renderiza en un elemento `<canvas>` el patrón del código QR con los marcadores de posición estándar (finder patterns 7x7) y la carga de datos del pago.
- **Garantía Fallback Anti-Cuadro Blanco:** Si el navegador bloquea el contexto 2D del canvas o surge una excepción, el contenedor inyecta automáticamente una tarjeta visual SVG con los datos del Alias, el monto exacto y el botón de copiado, asegurando que el modal jamás quede vacío.
- **Compatibilidad Mercado Pago:** Carga en el portapapeles el alias directo `jmg2011` y formatea la URL para cobros rápidos.

---

## 5. Privacidad y Seguridad del Modo Cliente (Pase Digital)

- La vista cliente se activa cuando la URL contiene el parámetro `?pase=<token>`.
- Al detectarse dicho parámetro, el script oculta el contenedor `#admin-view` y renderiza exclusivamente el contenedor `#pase-view`.
- **Aislamiento Total:** El amigo no tiene acceso al árbol de amigos, ni a las métricas del administrador, ni a la configuración de tarifas. Solo se le proyecta su propia ficha con su desglose y su código QR de pago.

---

## 6. Formatos y Localización Argentina

- **Moneda:** Formateador `formatARS(val)` configurado con `Intl.NumberFormat('es-AR')` respetando la regla de separación de miles por puntos y decimales por coma (`$ 11.544,95`).
- **Teléfonos WhatsApp:** La función `limpiarTelefonoArg(tel)` sanitiza el número telefónico ingresado eliminando prefijos de discado local (`0` y `15`) y anteponiendo el código de país y móvil internacional de Argentina (`+54 9`).

---

## 7. Despliegue en GitHub Pages

Para publicar la aplicación:
1. Subir los archivos `index.html`, `styles.css`, `app.js` y `GEMINI.md` a un repositorio de GitHub.
2. Ir a **Settings > Pages** en el repositorio.
3. En **Source**, seleccionar la rama principal (`main` o `master`) y la carpeta `/ (root)`.
4. En 1 minuto la aplicación estará disponible en la URL pública con soporte HTTPS gratuito.

---

## 8. Arquitectura PWA (Progressive Web App)

- **Manifiesto:** `manifest.json` configurado en modo `standalone` con iconos vectoriales maskables SVG.
- **Service Worker (`sw.js`):** Estrategia Network-First con fallback a Cache para disponibilidad offline y actualización instantánea de cambios.
- **Event Hooking:** Captura del evento `beforeinstallprompt` para activar el botón nativo de instalación desde la interfaz de usuario.
