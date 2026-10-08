# Pruebas manuales de citas

## Requisitos

1. MongoDB iniciado.
2. API NestJS iniciada en `http://localhost:3000/api`.
3. Un médico activo con horario configurado en ambas fechas de prueba.
4. Un paciente activo.
5. Las fechas deben ser futuras y corresponder a días incluidos en el horario del médico.

## Prueba automatizada en PowerShell

Desde la raíz del API:

```powershell
powershell -ExecutionPolicy Bypass -File .\test\manual\test-appointments-flow.ps1 `
  -DoctorId "REEMPLAZA_DOCTOR_ID" `
  -PatientId "REEMPLAZA_PATIENT_ID" `
  -Date "2026-07-30" `
  -RescheduleDate "2026-08-04"
```

El script crea tres citas y valida:

- filtros por paciente, médico, fecha, estado y próximas citas;
- confirmación;
- reprogramación;
- liberación del horario anterior;
- cancelación;
- liberación del horario cancelado;
- cita completada;
- inasistencia;
- filtros de estados terminales.

## REST Client

El archivo `appointments.http` puede ejecutarse con la extensión REST Client de VS Code. Reemplaza sus variables antes de enviar las solicitudes.
