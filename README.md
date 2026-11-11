# Juan Carlos | Mines AI 💎 — Sistema Completo de Conversaciones Automáticas para Telegram y Panel de Administración (Infraestructura 100% Google)

Sistema de producción completo, determinista y seguro para Telegram alojado y desplegado íntegramente en la **infraestructura de Google** (Google AI Studio + Google Cloud Run + Firebase Cloud Firestore):

- **Base de Datos Google Cloud Firestore**: 8 colecciones configuradas y sincronizadas en tiempo real (`users`, `messages`, `conversations`, `flows`, `conditions`, `media`, `settings`, `processed_updates`).
- **Cero Dependencia de Gemini / Cero IA no determinista**: Todo el flujo es determinista con reconocimiento inteligente de palabras clave, botones inline y expresiones regulares de ID de cuenta.
- **15 Pasos Secuenciales**: Desde `/start` hasta el cierre con advertencia de azar y juego responsable (+18).
- **Seguimiento de IDs de Cuenta**: 4 estados de auditoría (`ID recibido`, `Pendiente de revisión`, `Revisado`, `No verificable`).
- **Menú Privado de Administrador en Telegram**: Comando `/admin` exclusivo para el `ADMIN_TELEGRAM_ID` con 10 opciones interactivas.
- **Deduplicación e Idempotencia**: Cada `update_id` de Telegram se registra en la colección `processed_updates` de Firestore para prevenir respuestas repetidas.
- **Publicación Directa en Google AI Studio**: Listo para publicar mediante el botón **Publish** a Google Cloud Run en un único servicio web full-stack.

---

## 1. Arquitectura de Datos en Firebase Cloud Firestore

El sistema persiste todos sus datos en la base de datos Firestore provisionada en Google Cloud:

1. **`users`**: Directorio de usuarios de Telegram con `currentStep`, `declaredCountry`, `experienceLevel`, `accountId`, `accountStatus`, y contadores de mensajes.
2. **`messages`**: Plantillas de mensajes para los 15 pasos con texto, tipos de contenido, adjuntos multimedia y teclados de botones.
3. **`conversations`**: Historial cronológico de chats entre cada usuario y el bot.
4. **`flows`**: Configuración de los 15 nodos secuenciales del recorrido.
5. **`conditions`**: Diccionario de palabras clave deterministas (afirmativas, negativas, país, IDs numéricos).
6. **`media`**: Biblioteca de los 8 archivos multimedia reales (foto París, vídeo Mines, 3 chats de testimonios, 3 capturas de cómo encontrar ID).
7. **`settings`**: Configuraciones generales y del bot (`bot_config`, `general_config`).
8. **`processed_updates`**: Registro de deduplicación de eventos de Telegram por `update_id`.

---

## 2. Variables de Entorno del Backend en Google Cloud

Configura estas variables en el panel de **Secrets** de Google AI Studio o en las variables de entorno de Cloud Run:

```env
# Puerto del servidor (Cloud Run lo asigna automáticamente a 3000 o $PORT)
PORT=3000

# Token del bot entregado por @BotFather en Telegram
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ"

# Token secreto para validar cabecera X-Telegram-Bot-Api-Secret-Token
WEBHOOK_SECRET="super_secreto_webhook_seguro_mines_ai"

# Tu ID numérico personal de Telegram para desbloquear /admin
ADMIN_TELEGRAM_ID="684920153"

# URL pública de tu servicio en Cloud Run (Google AI Studio la inyecta automáticamente)
APP_URL="https://ais-pre-nplfvywaduuprl3vlwxg4c-529186632559.us-east1.run.app"
```

---

## 3. Publicación desde Google AI Studio (Cloud Run)

1. En la esquina superior derecha de Google AI Studio, haz clic en el botón **Publish**.
2. AI Studio compilará el frontend con `npm run build` y empaquetará el servidor Express (`server.ts`).
3. El servicio Cloud Run publicado atenderá simultáneamente:
   - El panel de administración web en la ruta raíz `/`.
   - El webhook de Telegram en `/api/telegram/webhook`.
   - El monitor de salud en `/health` y `/api/health`.

---

## 4. Configurar el Webhook en Telegram

Una vez publicado el servicio en Cloud Run (o utilizando la URL de desarrollo), ejecuta este comando en tu terminal para registrar el webhook con validación secreta:

```bash
curl -F "url=https://TU-SERVICIO-CLOUD-RUN.run.app/api/telegram/webhook" \
     -F "secret_token=TU_WEBHOOK_SECRET" \
     https://api.telegram.org/botTU_TELEGRAM_BOT_TOKEN/setWebhook
```

Para comprobar el estado del webhook:
```bash
curl https://api.telegram.org/botTU_TELEGRAM_BOT_TOKEN/getWebhookInfo
```

---

## 5. Menú Privado de Administrador en Telegram (`/admin`)

Cuando escribes `/admin` desde tu cuenta de Telegram (`ADMIN_TELEGRAM_ID`), el bot te responde con el menú de 10 opciones interactivas:

1. **Mensajes**: Modificar textos de los 15 pasos.
2. **Preguntas**: Cambiar preguntas de país, experiencia, etc.
3. **Respuestas y Condiciones**: Ajustar palabras clave aceptadas.
4. **Fotografías**: Ver o sustituir las imágenes del flujo.
5. **Vídeos**: Gestionar el vídeo de demostración.
6. **Tutoriales**: Actualizar guías paso a paso.
7. **Usuarios**: Consultar el número y listado de usuarios en Firestore.
8. **Seguimiento de Registros**: Revisar IDs de cuenta enviados y cambiar su estado (`id_recibido`, `pendiente_revision`, `revisado`, `no_verificable`).
9. **Enlaces**: Modificar el enlace de afiliado 1xBet.
10. **Ajustes**: Configurar modo mantenimiento y estado del bot.

---

## 6. Juego Responsable (+18)

Este sistema cumple rigurosamente con las directrices éticas:
- No promete ganancias ni resultados seguros.
- Recuerda siempre que Mines depende del azar (RNG).
- Acceso exclusivo para mayores de 18 años.
