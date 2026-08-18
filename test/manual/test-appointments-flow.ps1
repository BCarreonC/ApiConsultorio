param(
    [Parameter(Mandatory = $true)]
    [string]$DoctorId,

    [Parameter(Mandatory = $true)]
    [string]$PatientId,

    [Parameter(Mandatory = $true)]
    [string]$Date,

    [Parameter(Mandatory = $true)]
    [string]$RescheduleDate,

    [string]$BaseUrl = "http://localhost:3000/api",
    [int]$DurationMinutes = 30
)

$ErrorActionPreference = "Stop"

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw "PRUEBA FALLIDA: $Message"
    }

    Write-Host "OK: $Message" -ForegroundColor Green
}

function Invoke-Api {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("GET", "POST", "PATCH")]
        [string]$Method,

        [Parameter(Mandatory = $true)]
        [string]$Path,

        [hashtable]$Body
    )

    $uri = "$BaseUrl$Path"
    Write-Host "`n$Method $uri" -ForegroundColor Cyan

    if ($null -ne $Body) {
        $json = $Body | ConvertTo-Json -Depth 10
        Write-Host $json
        return Invoke-RestMethod `
            -Method $Method `
            -Uri $uri `
            -ContentType "application/json" `
            -Body $json
    }

    return Invoke-RestMethod -Method $Method -Uri $uri
}

function Get-Availability {
    param([string]$TargetDate)

    $path = "/appointments/availability" +
        "?doctorId=$([uri]::EscapeDataString($DoctorId))" +
        "&date=$([uri]::EscapeDataString($TargetDate))" +
        "&durationMinutes=$DurationMinutes"

    return Invoke-Api -Method GET -Path $path
}

function Create-TestAppointment {
    param(
        [string]$TargetDate,
        [object]$Slot,
        [string]$Reason
    )

    return Invoke-Api -Method POST -Path "/appointments" -Body @{
        doctorId = $DoctorId
        patientId = $PatientId
        date = $TargetDate
        startTime = $Slot.startTime
        endTime = $Slot.endTime
        reason = $Reason
        notes = "Creada por test-appointments-flow.ps1"
    }
}

Write-Host "=== PRUEBAS DE GESTIÓN DE CITAS ===" -ForegroundColor Yellow

$availability = Get-Availability -TargetDate $Date
$slots = @($availability.availableSlots)
Assert-True ($slots.Count -ge 3) (
    "La fecha inicial tiene al menos tres horarios disponibles"
)

$appointmentToReschedule = Create-TestAppointment `
    -TargetDate $Date `
    -Slot $slots[0] `
    -Reason "Prueba de reprogramación y cancelación"

$appointmentToComplete = Create-TestAppointment `
    -TargetDate $Date `
    -Slot $slots[1] `
    -Reason "Prueba de cita completada"

$appointmentNoShow = Create-TestAppointment `
    -TargetDate $Date `
    -Slot $slots[2] `
    -Reason "Prueba de inasistencia"

$idA = [string]$appointmentToReschedule._id
$idB = [string]$appointmentToComplete._id
$idC = [string]$appointmentNoShow._id

Assert-True (-not [string]::IsNullOrWhiteSpace($idA)) "Se creó la cita A"
Assert-True (-not [string]::IsNullOrWhiteSpace($idB)) "Se creó la cita B"
Assert-True (-not [string]::IsNullOrWhiteSpace($idC)) "Se creó la cita C"

$byPatient = Invoke-Api -Method GET -Path (
    "/appointments?patientId=$PatientId&date=$Date"
)
Assert-True (@($byPatient)._id -contains $idA) "Filtro por paciente"

$byDoctor = Invoke-Api -Method GET -Path (
    "/appointments?doctorId=$DoctorId&date=$Date"
)
Assert-True (@($byDoctor)._id -contains $idB) "Filtro por médico"

$byDate = Invoke-Api -Method GET -Path "/appointments?date=$Date"
Assert-True (@($byDate)._id -contains $idC) "Filtro por fecha"

$scheduled = Invoke-Api -Method GET -Path (
    "/appointments?status=scheduled&date=$Date"
)
Assert-True (@($scheduled)._id -contains $idA) "Filtro por estado scheduled"

$upcoming = Invoke-Api -Method GET -Path "/appointments?upcoming=true"
Assert-True (@($upcoming)._id -contains $idA) "Filtro de próximas citas"

$confirmed = Invoke-Api -Method PATCH -Path (
    "/appointments/$idA/confirm"
)
Assert-True ($confirmed.status -eq "confirmed") "Confirmar cita"

$rescheduleAvailability = Get-Availability -TargetDate $RescheduleDate
$rescheduleSlots = @($rescheduleAvailability.availableSlots)
Assert-True ($rescheduleSlots.Count -ge 1) (
    "La nueva fecha tiene un horario disponible"
)

$oldStartTime = [string]$appointmentToReschedule.startTime
$newSlot = $rescheduleSlots[0]

$rescheduled = Invoke-Api -Method PATCH -Path (
    "/appointments/$idA/reschedule"
) -Body @{
    date = $RescheduleDate
    startTime = $newSlot.startTime
    durationMinutes = $DurationMinutes
}

Assert-True ($rescheduled.status -eq "scheduled") (
    "La cita reprogramada vuelve a scheduled"
)
Assert-True ($rescheduled.startTime -eq $newSlot.startTime) (
    "La cita usa el nuevo horario"
)
Assert-True (@($rescheduled.rescheduleHistory).Count -ge 1) (
    "Se conserva el historial de reprogramación"
)

$oldAvailability = Get-Availability -TargetDate $Date
$oldSlotReleased = @($oldAvailability.availableSlots) |
    Where-Object { $_.startTime -eq $oldStartTime }
Assert-True ($null -ne $oldSlotReleased) (
    "La reprogramación libera el horario anterior"
)

$cancelled = Invoke-Api -Method PATCH -Path (
    "/appointments/$idA/cancel"
) -Body @{
    cancellationReason = "Cancelada por prueba automatizada"
}
Assert-True ($cancelled.status -eq "cancelled") "Cancelar cita"
Assert-True (-not [string]::IsNullOrWhiteSpace($cancelled.cancelledAt)) (
    "La cancelación guarda cancelledAt"
)

$newAvailability = Get-Availability -TargetDate $RescheduleDate
$newSlotReleased = @($newAvailability.availableSlots) |
    Where-Object { $_.startTime -eq $newSlot.startTime }
Assert-True ($null -ne $newSlotReleased) (
    "La cancelación libera el horario reprogramado"
)

$completed = Invoke-Api -Method PATCH -Path (
    "/appointments/$idB/complete"
)
Assert-True ($completed.status -eq "completed") (
    "Marcar cita como atendida"
)

$noShow = Invoke-Api -Method PATCH -Path (
    "/appointments/$idC/no-show"
)
Assert-True ($noShow.status -eq "no_show") (
    "Marcar inasistencia"
)

$cancelledList = Invoke-Api -Method GET -Path (
    "/appointments?status=cancelled"
)
Assert-True (@($cancelledList)._id -contains $idA) (
    "La cita cancelada aparece en el filtro cancelled"
)

$completedList = Invoke-Api -Method GET -Path (
    "/appointments?status=completed"
)
Assert-True (@($completedList)._id -contains $idB) (
    "La cita atendida aparece en el filtro completed"
)

$noShowList = Invoke-Api -Method GET -Path (
    "/appointments?status=no_show"
)
Assert-True (@($noShowList)._id -contains $idC) (
    "La inasistencia aparece en el filtro no_show"
)

Write-Host "`n=== TODAS LAS PRUEBAS TERMINARON CORRECTAMENTE ===" `
    -ForegroundColor Green
Write-Host "Cita cancelada: $idA"
Write-Host "Cita completada: $idB"
Write-Host "Cita no-show: $idC"
