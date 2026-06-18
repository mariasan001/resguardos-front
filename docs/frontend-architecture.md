# Frontend Architecture

## Objetivo

Este frontend administra el flujo de resguardos institucionales con `Next.js 16` y `React 19`.
La meta de la arquitectura es separar claramente:

- rutas y composicion;
- UI reutilizable;
- flujo funcional por feature;
- servicios e integracion con backend;
- persistencia temporal del draft;
- generacion y distribucion del PDF.

## Stack

- `Next.js 16.2.9` con `App Router`
- `React 19.2.4`
- `TypeScript`
- `CSS Modules`
- `jsPDF` para generar PDF en cliente
- `signature_pad` para captura de firma
- `sonner` para toasts controlados

## Estructura real

```text
src/
  app/
    (workspace)/
      catalogos/
      resguardos/[id]/
      usuarios/
    (resguardos-list)/
      resguardos/
        nuevo/
        [id] no existe aqui; el detalle vive en (workspace)
    api/
      email/cargar-con-archivo/[id]/
      resguardos/
      usuarios/[neyemp]/email/
  components/
    layout/
    providers/
    ui/
  features/
    email/
    resguardos/
    usuarios/
  hooks/
  lib/
    api/
    config/
    services/
    types/
    utils/
```

## Responsabilidades por capa

### `src/app`

- Define rutas, layouts, loading y error boundaries.
- Resuelve carga inicial desde server components.
- Mantiene los route handlers que actuan como proxy al backend real.

### `src/features/resguardos`

- Orquesta el flujo de captura, revision, firma, generacion de PDF y acciones posteriores.
- `ResguardoCreateForm.tsx` captura el draft.
- `ResguardoPreview.tsx` concentra el flujo de confirmacion, firma, persistencia y resultado final.
- `ResguardoVerificationCard.tsx` encapsula captura y validacion de firma.
- `ResguardoRowActions.tsx` cubre acciones operativas desde el listado.

### `src/lib/services`

- Es la capa canonica para llamar APIs del backend o proxies locales.
- No debe duplicarse logica de `fetch` dentro de componentes visuales.

### `src/lib/utils`

- Mappers de payload y summary.
- Draft local de resguardo.
- Utilidades de archivos y firma.
- Formateo y cache local de usuarios actualizados.

## Flujo principal de resguardos

### 1. Captura

Ruta: `/resguardos/nuevo`

- Se cargan catalogos y usuarios en servidor.
- El usuario captura datos del equipo, responsables, control y accesorios.
- El draft del frontend maneja `referenciaInterna` como nombre semantico local, pero lo serializa al campo `resguardo` del backend porque ese es el contrato real disponible hoy.
- El formulario no llama al backend todavia.
- La accion `Revisar resguardo` serializa un draft en `localStorage`.

### 2. Revision previa

Ruta: `/resguardos/nuevo/preview`

- Se reconstruye el draft desde `localStorage`.
- Se presenta un resumen legible por secciones.
- El usuario puede capturar firma y ajustar correo del titular antes del guardado final.

### 3. Confirmacion y persistencia

Desde `ResguardoPreview.tsx`

Orden actual del flujo:

1. Validar que exista firma confirmada.
2. Validar y sincronizar correo del titular si fue capturado.
3. Crear resguardo.
4. Extraer `createdResguardoId` de la respuesta.
5. Subir firma al resguardo ya creado.
6. Preparar vista previa del PDF usando datos del backend.

### 4. Estado final

Despues del exito:

- la pantalla cambia a modo de solo lectura;
- la vista previa del PDF permanece como bloque principal;
- `Descargar PDF` y `Enviar por email` solo se habilitan cuando existe un PDF generado valido;
- si la vista previa falla, se muestra un estado recuperable con boton de reintento.

### 5. Recuperacion

Si el usuario vuelve a abrir la vista previa con un `createdResguardoId` ya persistido:

- el frontend intenta reconstruir automaticamente la vista previa del PDF;
- no depende de que el usuario recorra otra vez todo el flujo;
- si falla, queda un estado claro y recuperable.

## Estados clave del flujo

### Draft

- `idle`
- sin resguardo creado
- editable

### Guardando resguardo

- `saving_resguardo`
- boton principal bloqueado
- acciones de firma y correo bloqueadas

### Subiendo firma

- `uploading_firma`
- evita doble submit y cambios de estado inconsistentes

### Firma pendiente de carga

- `signature_error`
- el resguardo ya existe
- la firma no quedo registrada
- se permite reintentar sin duplicar alta

### Exito final

- `success`
- pantalla en solo lectura
- vista previa del PDF visible
- acciones de descarga y email disponibles

## Servicios y contratos usados

### Resguardos

- `getResguardos()`
- `getResguardoById(id)`
- `createResguardo(payload)`
- `uploadResguardoFirma(id, file)`
- `getResguardoFirma(id)`

Campo semantico relevante:

- backend `resguardo`: referencia interna o de control capturada por el usuario;
- folio del PDF: se genera a partir del `id` del resguardo ya persistido, no del texto capturado en `resguardo`.

### Usuarios

- `getUsuarios()`
- `getUsuarioById(id)`
- `updateUsuarioEmail(neyemp, email)`

### Email

- `sendResguardoEmailWithPdf(id, archivo)`

## Route handlers internos

Estos endpoints viven en `src/app/api` y actuan como proxy hacia el backend configurado en `BACKEND_API_URL`:

- `/api/resguardos`
- `/api/resguardos/[id]`
- `/api/resguardos/[id]/firma`
- `/api/usuarios/[neyemp]/email`
- `/api/email/cargar-con-archivo/[id]`

## Decisiones de UI y UX

- La vista previa del PDF es parte central del resultado final, no una accion secundaria.
- Los toasts se usan como apoyo, no como unica fuente de feedback.
- Los estados de error relevantes se muestran dentro del flujo.
- La firma se confirma explicitamente antes de enviar el resguardo.
- El modo `readOnly` evita seguir editando cuando el resguardo ya fue creado.

## Correcciones aplicadas en la auditoria

- Se alineo el endpoint de actualizacion de email de usuarios al contrato real del backend en cliente, servidor y proxy local.
- Se corrigio la ambiguedad semantica del campo `resguardo`: en frontend ahora se trata como `referenciaInterna`, mientras el payload al backend sigue enviando `resguardo` por compatibilidad.
- Se agrego reconstruccion automatica del PDF cuando ya existe un resguardo generado.
- Se agrego reintento explicito para la vista previa del PDF.
- Se bloquearon mejor controles de firma y revision durante la confirmacion para evitar cambios concurrentes.
- Se recupero la accion de `Editar` en encabezados donde ya se estaba enviando `editHref`.
- Se elimino `console.error` innecesario del boundary de error y se movio su estilo inline a CSS Module.

## Riesgos y pendientes reales

- No hay pruebas automatizadas de integracion para el flujo completo de resguardos.
- La generacion de PDF ocurre en cliente; si el documento crece mucho o el dispositivo es limitado, puede impactar rendimiento.
- El contrato de creacion de resguardo sigue siendo flexible porque backend expone entidad completa y no un DTO de alta.
- La recuperacion del draft depende de `localStorage`; no hay persistencia cross-device ni server-side draft.
- El proyecto todavia no tiene suite E2E para validar firma, PDF y envio de email contra un backend de prueba.

## Criterio actual de salida

El proyecto queda en mejor condicion para produccion si:

- el backend mantiene los contratos hoy consumidos;
- se valida manualmente el flujo completo contra ambiente real o staging;
- se agenda una capa minima de pruebas E2E antes de una siguiente iteracion mayor.
