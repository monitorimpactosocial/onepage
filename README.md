# PARACEL ONEPAGE, app web de reportes mensuales

Aplicación Flask para sustituir el enlace de Excel en línea por una app web autenticada, con captura por área, administración central, recordatorios mensuales, tablero interactivo y exportación del repositorio a libro Excel y a libro en línea.

## Mejoras incorporadas

- inicio de sesión por usuario y contraseña
- usuario `admin` con contraseña inicial `paracel2026`
- solo el administrador puede crear o eliminar preguntas
- los usuarios responsables pueden gestionar las listas fijas y filas repetibles de su área cuando la pregunta esté marcada como lista editable
- ejemplo implementado, `D. Fomento – Contratos y Ejecución`, con alta, baja y edición de proveedores
- observaciones laterales únicamente cuando la pregunta lo requiera
- carga de documentos adjuntos de respaldo
- bloque de texto libre por formulario, incorporado al reporte imprimible
- uso permanente del logo corporativo, con posibilidad de reemplazo desde Administración
- selector de período en formularios y dashboard, con referencia del mismo período del año anterior
- dashboard ejecutivo con KPIs y series históricas
- reporte imprimible, listo para guardar en PDF desde el navegador
- exportación del repositorio al libro `PARACEL_repositorio_mensual_online.xlsx`
- carga del libro exportado a OneDrive o SharePoint mediante Microsoft Graph, cuando se configuren credenciales
- envío de recordatorios mensuales el día 25 al responsable de cada área

## Puesta en marcha

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py seed
flask --app run.py run
```

La primera carga crea:

- base de datos SQLite
- catálogos de áreas, usuarios, preguntas y listas
- usuario administrador `admin`
- contraseñas temporales para responsables, `cambiar2026`
- libro de salida en `instance/PARACEL_repositorio_mensual_online.xlsx`

## Rutas principales

- `/login`
- `/`
- `/dashboard`
- `/form/<area_code>/<period_key>`
- `/lists/<list_code>`
- `/report/<period_key>`
- `/admin`
- `/admin/settings`
- `/admin/users`
- `/admin/areas`
- `/admin/questions`
- `/admin/options`
- `/admin/export-workbook`
- `/tasks/send-reminders`

## Scheduler

La app inicia un `BackgroundScheduler` mensual. En producción, se recomienda además disparar `/tasks/send-reminders` desde un cron del servidor, o desde el scheduler de la plataforma de despliegue.

## Libro en línea

La app siempre genera un libro Excel local consolidado. Si se cargan las variables `GRAPH_*`, el archivo se sube automáticamente a OneDrive o SharePoint, dejando un libro en línea actualizado.

## Despliegue

Esta versión requiere backend, base de datos y almacenamiento de archivos, por lo que el código puede mantenerse en el repositorio `onepage`, pero la ejecución debe hacerse sobre un servicio de aplicación, por ejemplo Render, Railway, Azure App Service o un servidor propio. El uso de GitHub Pages, por sí solo, no cubre autenticación segura, adjuntos ni lógica de servidor.

## Observaciones técnicas

- el dashboard trabaja sobre la base de datos de la app
- el libro Excel queda como repositorio auditable y respaldo
- el reporte PDF se obtiene con la opción de imprimir del navegador
- el logo por defecto se incluye en `app/static/img/logo_paracel.png`, y puede ser reemplazado desde Administración
