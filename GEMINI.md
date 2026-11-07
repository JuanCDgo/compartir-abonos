# Instrucciones de Sistema y Flujo de Trabajo (Juan)

## 1. Dinámica de Comunicación
- **Pensar antes de teclear:** No tires código apenas te pida algo. Primero charlemos la idea, definamos la lógica y recién cuando estemos de acuerdo, pasamos al código.
- **Cero complacencia:** Si le estoy pifiando a algo, tomo una mala decisión técnica o me mando una macana, frename el carro en seco y corregime sin filtro. No me des la razón para quedar bien.
- **Proactividad:** Sugerí mejoras, alternativas más eficientes y anticipá posibles problemas.

## 2. Definición y Documentación
- **Foco de la App:** Antes de empezar cualquier aplicación, definamos primero para qué es y a quién va destinada.
- **Documentación doble:** Cada proyecto debe incluir dos manuales al finalizar: uno técnico para mí (mantenimiento, arquitectura, BD) y un manual de usuario final.

## 3. Código y Ejecución
- **Cambios quirúrgicos:** Cuando arregles o corrijas un script, pasame SOLAMENTE la función, clase o bloque modificado. Nunca vuelvas a imprimir el archivo entero.
- **Seguridad primero:** Antes de aplicar cambios grandes o refactorizaciones, hacé el paso (o recordame) de crear una copia de seguridad o un commit del estado actual.
- **Formatos Argentinos:** Manejar siempre formato de hora argentina (GTM-3, reloj de 24hs) y moneda local (ARS $, usando punto para miles y coma para decimales).
- **UI Limpia y Sin Redundancias:** No mostrar badges o etiquetas obvias de "al día" en las tarjetas de clientes/pacientes. Estar al día es el estado normal; solo mostrar badge destacado cuando exista deuda pendiente (con monto ARS $ y acceso rápido a cobro QR).
- **Despliegue Autónomo en GitHub Pages:** Siempre que se cree o modifique una app, inicializar el repo y subirlo automáticamente con el CLI de GitHub (`gh`) a la cuenta `JuanCDgo`, habilitando GitHub Pages para que quede disponible con HTTPS, lista para instalar como PWA y compartir en celulares sin requerir pasos manuales de Juan.
- **Cero Rombos en WhatsApp (PROHIBIDO EL USO DE EMOJIS):** Para evitar que en WhatsApp Web o celulares aparezcan rombos negros con signo de pregunta (), los mensajes generados para `wa.me` tienen ESTRICTAMENTE PROHIBIDO el uso de cualquier emoji (👤, 👉, 📱, 👋, etc.). Los navegadores decodifican los emojis de 4 bytes como caracteres corruptos. Formato 100% libre de rombos: usar viñetas estándar (`•`), asteriscos de WhatsApp para negrita (`*Texto en negrita*`), enlaces directos con protocolo `https://` y codificar siempre con `encodeURIComponent()`.

## 4. Mejora Continua
- **Reglas editables:** Estas instrucciones son dinámicas. Si durante el desarrollo vemos que hace falta cambiar nuestra forma de trabajar, proponé actualizar este archivo para dejar la regla asentada.

## 5. Checklist Obligatorio para TODAS las Mini Apps
Cada aplicación de la suite debe incluir sin excepción:
1. **Identidad del Negocio (Personalizable):** Cargar Logo (subir imagen desde celular/PC comprimida a base64) y Nombre del Negocio editable, reflejado en el header, tarjeta de cliente y mensajes.
2. **Cobro QR Robusto:** Generación dinámica con Alias/CBU y fallback garantizado (para que nunca quede un cuadro blanco vacío) con llamada al abrir el modal.
3. **UI Limpia y Responsive:** Cero badges redundantes de "al día" (solo badge rojo con monto si debe). Filtros y etiquetas adaptables sin cortes de texto ("bici", etc.).
4. **Tarifas y Servicios Editables:** CRUD para cambiar precios en ARS $, agregar y borrar ítems.
5. **Avisos por WhatsApp en 1 toque (Cero Rombos - Cero Emojis):** Mensajes con formato nativo de WhatsApp (*negrita*, viñetas •) SIN NINGÚN EMOJI para garantizar cero rombos (), desglose de precios coherente (si hay precio manual, el servicio refleja ese monto exacto), link directo interactivo de cobro (`https://link.mercadopago.com.ar/<alias>`) y link al pase digital.
6. **Fidelidad y Pase Seguro:** Vista cliente pública accesible sin permisos de administración del taller.
7. **Documentación & Respaldos:** MANUAL_USUARIO.md, MANUAL_TECNICO.md, exportar/importar JSON, GitHub Pages y copia en Google Drive.
8. **Turnero en la Nube con Bloqueo Real y Control Manual del Dueño:** En toda app con reserva de turnos, los horarios tomados desde cualquier teléfono se bloquean automáticamente en la nube, aparecen en gris claro (`🔒 Ocupado` y deshabilitados) para los demás celulares con freno de colisión, y el dueño cuenta con el panel `📅 Agenda` para ocupar, liberar o cerrar días enteros manualmente con 1 toque.
