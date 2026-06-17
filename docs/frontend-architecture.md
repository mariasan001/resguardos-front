# Arquitectura Frontend

## Contexto

El backend expone cuatro dominios funcionales en Swagger:

- `Resguardos`
- `Usuarios`
- `Catalogos`
- `Email`

La arquitectura del frontend se organiza respetando esos mismos módulos para evitar capas ambiguas y facilitar escalabilidad.

## Estructura propuesta

```text
src/
  app/
    (workspace)/
      catalogos/
      resguardos/
      usuarios/
    globals.css
    layout.tsx
    not-found.tsx
  components/
    layout/
    ui/
  features/
    email/
    resguardos/
    usuarios/
  lib/
    api/
    config/
    services/
    types/
    utils/
```

## Decisiones

- `App Router` como capa de rutas y composición.
- `Server Components` para carga de datos inicial, evitando `fetch` dentro de UI visual.
- `Client Components` solo donde hay interacción real: formularios, navegación activa y acciones.
- `Server Actions` para mutaciones (`crear resguardo`, `actualizar email`, `subir PDF y enviar correo`).
- `services` como capa única para hablar con backend.
- `types` basados únicamente en Swagger; cuando el contrato no es claro, se documenta el supuesto.
- `CSS Modules` para componentes y `globals.css` solo para tokens, reset y estilos verdaderamente globales.

## Rutas funcionales

- `/` Dashboard operativo
- `/resguardos` Consulta y filtros
- `/resguardos/nuevo` Alta de resguardo
- `/resguardos/[id]` Detalle y envío por correo
- `/usuarios` Directorio administrativo
- `/usuarios/[id]` Detalle y actualización de correo
- `/catalogos` Consulta de catálogos maestros

## Hallazgos del Swagger

### 1. Endpoints duplicados de usuarios

Existen ambos:

- `/api/usuarios`
- `/api/usuario`

Y también:

- `/api/usuarios/{id}`
- `/api/usuario/{id}`

Decisión temporal:

- Consumir `/api/usuarios` y `/api/usuarios/{id}` como endpoints canónicos.
- Documentar el duplicado para aclaración posterior con backend.

### 2. Contrato de error poco expresivo

Varias respuestas `404` reutilizan el mismo schema del `200`, lo que no permite inferir si el body trae un objeto vacío, nulo o un mensaje estructurado.

Decisión temporal:

- La capa API normaliza errores HTTP a una excepción tipada.
- Las páginas renderizan estado de error controlado sin depender del body del `404`.

### 3. Alta de resguardo con entidad completa

El `POST /api/resguardos` usa el schema completo `Resguardo` como request body, sin un DTO específico de creación.

Decisión temporal:

- El frontend arma un payload mínimo compatible con la entidad publicada.
- Las relaciones se envían por referencia parcial (`id`, `neyemp`) cuando aplica.
- Si backend exige más campos, el formulario ya está aislado para ajustar el mapper sin rehacer la UI.

### 4. Catálogos sin paginación

Todos los catálogos son listas completas.

Decisión temporal:

- Carga directa en servidor.
- Reutilización en formulario de alta mediante opciones tipadas.

## Preparación para producción

- URL base centralizada en `lib/config/env.ts`
- Manejo consistente de loading, error y empty states
- Tokens visuales desde el inicio
- Sin lógica de negocio dentro de componentes de presentación
- Componentes reutilizables para tablas, tarjetas, encabezados, estados y badges
