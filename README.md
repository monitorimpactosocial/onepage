# PARACEL · Sistema de Reportes Mensuales (SRM)

Aplicación web estática para la carga, consolidación y visualización de indicadores mensuales de PARACEL S.A.

## Estructura de archivos

```
/
├── index.html          # Shell principal (login + app)
├── css/
│   └── style.css       # Estilos completos
└── js/
    ├── config.js       ← EDITAR PRIMERO: usuarios, áreas, API keys
    ├── auth.js         # Autenticación por sesión
    ├── graph.js        # Microsoft Graph API (Excel + Outlook)
    ├── forms.js        # Formularios de carga por área
    ├── dashboard.js    # Tablero interactivo con gráficos
    ├── admin.js        # Panel de administración
    ├── reminders.js    # Recordatorios automáticos (día 25)
    └── app.js          # Controlador principal
```

## Configuración paso a paso

### 1. Usuarios y contraseñas
Editar `js/config.js` → objeto `USERS`. Cambiar las contraseñas antes de publicar.

**Credenciales por defecto:**
| Usuario | Contraseña | Área |
|---------|-----------|------|
| admin | paracel2026 | Administrador |
| hse.industrial | hse2026 | SSL Industrial |
| hse.forestal | hse2026f | SSL Forestal |
| forestal.ops | forOps2026 | Operaciones Forestales |
| industrial.ops | indOps2026 | Operaciones Industriales |
| rrhh | rrhh2026 | Talento Humano |
| finanzas | fin2026 | Finanzas |
| compras | cmp2026 | Compras |
| comunicacion | com2026 | Comunicación Social |
| ambiental | amb2026 | Ambiental |
| logistica | log2026 | Logística |
| fomento | fom2026 | Forestal Fomento |

### 2. Configurar Microsoft 365 / Graph API (para Excel y Outlook)

1. Ir a [portal.azure.com](https://portal.azure.com)
2. **Azure Active Directory → Registros de aplicaciones → + Nueva**
   - Nombre: `PARACEL SRM`
   - Cuentas compatibles: Solo esta organización
   - URI de redirección: Plataforma **SPA** → `https://monitorimpactosocial.github.io/onepage/`
3. **Permisos API → + Agregar permiso → Microsoft Graph → Delegados:**
   - `Files.ReadWrite`
   - `Mail.Send`
   - `User.Read`
4. **Otorgar consentimiento de administrador**
5. Copiar: **Id. de aplicación** (Client ID) y **Id. de directorio** (Tenant ID)
6. Subir el Excel de PARACEL a OneDrive y copiar el ID desde la URL
7. Actualizar `js/config.js`:
   ```js
   const GRAPH_CONFIG = {
     clientId:    'TU-CLIENT-ID',
     tenantId:    'TU-TENANT-ID',
     excelFileId: 'ID-DEL-ARCHIVO-EN-ONEDRIVE',
     redirectUri: 'https://monitorimpactosocial.github.io/onepage/',
     scopes:      ['Files.ReadWrite', 'Mail.Send', 'User.Read'],
   };
   ```

> **Mientras no se configure Microsoft 365**, los datos se guardan automáticamente en `localStorage` del navegador. Pueden exportarse como JSON desde Administración → Datos.

### 3. Publicar en GitHub Pages

1. Copiar todos los archivos al repositorio `monitorimpactosocial/onepage` (rama `main`)
2. Ir a Settings → Pages → Source: `main` / `/(root)`
3. Acceder en: `https://monitorimpactosocial.github.io/onepage/`

## Funcionalidades

| Feature | Descripción |
|---------|-------------|
| 🔐 Login por área | Cada responsable accede solo a su formulario |
| ⚙️ Admin total | Usuario `admin` ve todos los formularios y el tablero |
| 📊 Dashboard | Gráficos interactivos con Chart.js, KPIs, estado de completitud |
| 💾 Guardado dual | OneDrive/Excel vía Graph API + localStorage como fallback |
| 📧 Recordatorios | El día 25 de cada mes: envío automático vía Outlook |
| 📄 PDF | Impresión del tablero o formulario vía `window.print()` |
| 📅 Período configurable | Admin puede cambiar el mes activo desde el panel |

## Áreas configuradas

- 🛡️ SSL Industrial (HSE Industrial – Edilson Souza)
- 🛡️ SSL Forestal (HSE Forestal – Edilson Souza)
- 🌲 Operaciones Forestales (Sara Santos)
- 🌱 Forestal Propias y Fomento (Perla)
- 🏭 Operaciones Industriales (Keyloir Hermes)
- 👥 Talento Humano (Lucía Pereira)
- 💰 Finanzas (Dirección)
- 🛒 Compras (Dirección)
- 📢 Comunicación y Sust. Social (Comunicaciones/Social)
- 🌱 Sustentabilidad Ambiental (Gisselle)
- 🚛 Logística (Dirección)

## Seguridad

> ⚠️ GitHub Pages sirve archivos estáticos públicamente. Las contraseñas en `config.js` son visibles en el código fuente.
> 
> **Para mayor seguridad en producción:**
> - Integrar MSAL.js para autenticación OAuth2 con Microsoft Entra ID (Azure AD)
> - Los usuarios ingresan con sus cuentas Microsoft corporativas
> - No se necesitan contraseñas en el código

---
*© 2026 PARACEL S.A. · Sistema desarrollado con Claude AI*
