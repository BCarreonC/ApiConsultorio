# Gestión completa de citas

## Endpoints agregados

### Consultar citas

```http
GET /api/appointments?patientId=...
GET /api/appointments?doctorId=...
GET /api/appointments?date=2026-07-30
GET /api/appointments?status=scheduled
GET /api/appointments?pending=true
GET /api/appointments?upcoming=true
```

Los filtros se pueden combinar. `pending=true` incluye `scheduled` y `confirmed`. No debe combinarse con `status`.

### Cancelar

```http
PATCH /api/appointments/:id/cancel
Content-Type: application/json

{
  "cancellationReason": "El paciente no podrá asistir"
}
```

No elimina el documento. Guarda `cancelledAt`, `cancellationReason` y cambia el estado a `cancelled`.

### Reprogramar

```http
PATCH /api/appointments/:id/reschedule
Content-Type: application/json

{
  "date": "2026-08-04",
  "startTime": "12:00",
  "durationMinutes": 30
}
```

La API vuelve a validar médico, paciente, horario laboral y conflictos. El horario anterior se guarda en `rescheduleHistory`; la cita vuelve a `scheduled` para requerir una confirmación nueva.

### Estados

```http
PATCH /api/appointments/:id/confirm
PATCH /api/appointments/:id/complete
PATCH /api/appointments/:id/no-show
```

Transiciones soportadas:

```text
scheduled -> confirmed
scheduled -> completed
confirmed -> completed
scheduled -> cancelled
confirmed -> cancelled
scheduled -> no_show
confirmed -> no_show
scheduled/confirmed -> reschedule -> scheduled
```

Los estados terminales no pueden volver a modificarse mediante estas operaciones.

## Validación técnica

```powershell
npm install
npm run build
npm test -- appointments.controller.spec.ts
```

Las pruebas de integración manual están en `test/manual`.
