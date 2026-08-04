# Guía de Despliegue en Vercel (Rápido y Seguro)

Esta guía explica cómo desplegar la aplicación "Wild Rift Coach" en **Vercel** de forma sumamente sencilla y completamente segura, protegiendo tu API Key de Gemini mediante una **Función Serverless** integrada.

---

## 📋 ¿Cómo funciona la seguridad en Vercel?
1. **Frontend**: Vercel compila tu app de React/Vite y la sirve en su red de distribución global (CDN) con SSL gratuito automático.
2. **Backend**: Al subir el proyecto con la carpeta `api/`, Vercel crea automáticamente una **Función Serverless** en `/api/consult`.
3. **Cero exposición**: Tu clave `GEMINI_API_KEY` se guarda de forma segura en las variables de entorno de Vercel y es inyectada únicamente del lado del servidor. El navegador del usuario final nunca tiene acceso a ella.

---

## Paso 1: Configurar en Vercel
1. Inicia sesión en [Vercel](https://vercel.com/) (puedes ingresar usando tu cuenta de GitHub, GitLab o Bitbucket).
2. Haz clic en **Add New** (Añadir nuevo) y selecciona **Project** (Proyecto).
3. Importa el repositorio Git de tu proyecto "Wild Rift Coach".
4. En la sección **Configure Project** (Configuración de Proyecto), expande la pestaña **Environment Variables** (Variables de entorno).
5. Añade la siguiente variable:
   * **Name**: `GEMINI_API_KEY`
   * **Value**: *[Pega tu clave secreta de Google AI Studio]*
6. Haz clic en **Add** (Añadir).
7. Deja las configuraciones de Build y Output por defecto (Vercel detecta automáticamente que es un proyecto de Vite y usa `npm run build` y la carpeta `dist`).
8. Haz clic en **Deploy** (Desplegar).

¡Listo! En unos segundos tu aplicación estará activa bajo una URL pública de Vercel (por ejemplo: `https://wildrift-coach.vercel.app`).

---

## Paso 2: Desarrollo Local (Opcional)
Para correr el proyecto localmente apuntando a tu API Key local:
1. Asegúrate de tener el archivo `.env` en la raíz con:
   ```env
   VITE_GEMINI_API_KEY=tu_clave_local_de_gemini
   ```
2. Ejecuta `npm run dev` para levantar el entorno de desarrollo local. El código está configurado para llamar al SDK directo de Google de forma automática en local, y usar la función segura de Vercel `/api/consult` una vez subido a producción.
