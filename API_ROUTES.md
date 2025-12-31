API Routes - Carteras Personalizadas

Base URL: /api

Formato general: JSON requests/responses unless se indica multipart/form-data.

---
**Mensajes (conversaciones de pedidos)**

- POST /api/mensajes/pedidos
  - Descripción: Enviar un mensaje de texto en la conversación de un pedido.
  - Auth: Bearer JWT (cliente o admin)
  - Body (application/json):
    - pedidoId: string (UUID)
    - mensaje: string
  - Response: Mensaje guardado (objeto `MensajePedido`)

- POST /api/mensajes/pedidos/:pedidoId/image
  - Descripción: Subir una imagen asociada a la conversación de un pedido (opcional caption en campo `mensaje`).
  - Auth: Bearer JWT (cliente o admin)
  - Content-Type: multipart/form-data
  - Form fields:
    - image: file (jpg|jpeg|png|gif|webp)
    - mensaje: string (opcional, caption)
  - Response: Mensaje guardado con `imagenUrl` (objeto `MensajePedido`)

- GET /api/mensajes/pedidos/:pedidoId
  - Descripción: Obtener todos los mensajes de un pedido (ordenados por fecha asc).
  - Auth: Bearer JWT
  - Query: none
  - Response: Array de mensajes (`MensajePedido[]`). Cada mensaje contiene:
    - id, pedidoId, emisor (cliente|admin), emisorEmail, emisorNombre, mensaje, fecha, leido (boolean), leidoPor (array), imagenUrl? (string)

- PATCH /api/mensajes/pedidos/:pedidoId/marcar-leidos
  - Descripción: Marcar como leídos los mensajes del rol contrario en ese pedido.
  - Auth: Bearer JWT
  - Response: Número de mensajes marcados como leídos (integer)

- POST /api/mensajes/pedidos/internos
  - Descripción: Mensaje interno creado por admin (sin notificar al cliente directamente en la API pública).
  - Auth: Bearer JWT + Role=ADMIN
  - Body: DTO interno

---
**Mensajes generales / Contacto**

- POST /api/mensajes/contacto
  - Descripción: Enviar mensaje desde formulario de contacto (sin auth).
  - Body (application/json):
    - nombre: string
    - email: string
    - asunto?: string
    - mensaje: string
  - Response: objeto confirmando guardado

- GET /api/mensajes/contacto  (admin)
  - Descripción: Listar mensajes de contacto (admin only)
  - Auth: Bearer JWT + Role=ADMIN
  - Query params:
    - leido: true|false (opcional)
    - limite: number (opcional)
    - pagina: number (opcional)

- PATCH /api/mensajes/contacto/:id/marcar-leido (admin)
  - Descripción: Marcar un mensaje de contacto como leído.
  - Auth: Bearer JWT + Role=ADMIN

- PATCH /api/mensajes/contacto/:id/responder (admin)
  - Descripción: Responder a un mensaje de contacto (envía email al remitente).
  - Body: { mensaje: string }
  - Auth: Bearer JWT + Role=ADMIN

---
**Upload (archivos generales)**

- POST /upload/image
  - Descripción: Subir imagen (admin)
  - Auth: Bearer JWT + Role=ADMIN
  - Form: multipart/form-data, field `image`
  - Response: { message, filename, url }

- POST /upload/images
  - Descripción: Subir múltiples imágenes (admin)
  - Auth: Bearer JWT + Role=ADMIN
  - Form: multipart/form-data, field `images` (max 10)
  - Response: { success, urls, count }

- POST /upload/disenos (cliente)
  - Descripción: Subir un diseño personalizado (cliente auth required)
  - Form: multipart/form-data, field `image`
  - Response: { success, url, filename }

---
**Emails (endpoints internos / servicio)**

- El backend no expone endpoints públicos para enviar emails; el servicio `EmailService` se usa internamente en los flujos:
  - Bienvenida: `sendWelcomeEmail(to, nombre)` — disparado al crear usuario.
  - Confirmación de pedido: `sendOrderConfirmation(...)` — al confirmar/crear orden.
  - Notificaciones de pedido personalizado: `sendCustomOrderNotification(...)` y `sendCustomOrderStatusUpdate(...)`.
  - Notificaciones admin: `sendAdminOrderNotification(...)`, `sendAdminCustomOrderNotification(...)`.
  - Mensajes de contacto: `sendContactMessage(...)` — al recibir contacto.
  - Mensajes de pedido: se envían notificaciones desde `MensajesService` cuando se crea un mensaje (incluye ahora `imagenUrl` si corresponde).

---
**Formatos importantes**

- `MensajePedido` (respuesta de APIs de mensajes):
  - id: string (uuid)
  - pedidoId: string (uuid)
  - emisor: 'cliente' | 'admin'
  - emisorEmail: string
  - emisorNombre: string
  - mensaje: string
  - imagenUrl?: string (url pública a la imagen)
  - fecha: ISO string
  - leido: boolean
  - leidoPor: string[] (emails)

- Multipart form for images:
  - field `image`: binary file (jpg|png|gif|webp), max size ~5-10MB depending endpoint
  - optional textual fields (e.g., `mensaje`) can be included in the same multipart request

---
Si querés, puedo:
- Ejecutar un test local (POST multipart) para verificar la subida y la creación del mensaje.
- Hacer que el backend redirija TODOS los emails a una bandeja de pruebas temporalmente.
- Añadir soporte para múltiples imágenes por mensaje (array) en la entidad y endpoints.

