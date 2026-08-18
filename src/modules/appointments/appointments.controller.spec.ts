import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatus } from './constants/appointment-status.constant';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: jest.Mocked<
    Pick<
      AppointmentsService,
      | 'findAll'
      | 'cancel'
      | 'reschedule'
      | 'confirm'
      | 'complete'
      | 'markNoShow'
    >
  >;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      cancel: jest.fn(),
      reschedule: jest.fn(),
      confirm: jest.fn(),
      complete: jest.fn(),
      markNoShow: jest.fn(),
    };

    controller = new AppointmentsController(
      service as unknown as AppointmentsService,
    );
  });

  it('envía los filtros al listar citas', async () => {
    const query = {
      patientId: '66a1d75d88b6a3af95cb9278',
      status: AppointmentStatus.SCHEDULED,
      upcoming: true,
      limit: 20,
    };
    const expected = [{ _id: 'appointment-1' }];
    service.findAll.mockResolvedValue(expected as never);

    await expect(controller.findAll(query)).resolves.toEqual(expected);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('cancela una cita con motivo', async () => {
    const expected = { _id: 'appointment-1', status: 'cancelled' };
    service.cancel.mockResolvedValue(expected as never);

    await expect(
      controller.cancel('appointment-1', {
        cancellationReason: 'El paciente no podrá asistir',
      }),
    ).resolves.toEqual(expected);
  });

  it('reprograma una cita', async () => {
    const dto = {
      date: '2026-08-04',
      startTime: '12:00',
      durationMinutes: 30,
    };
    const expected = { _id: 'appointment-1', startTime: '12:00' };
    service.reschedule.mockResolvedValue(expected as never);

    await expect(controller.reschedule('appointment-1', dto)).resolves.toEqual(
      expected,
    );
    expect(service.reschedule).toHaveBeenCalledWith('appointment-1', dto);
  });

  it.each([
    ['confirm', 'confirm'],
    ['complete', 'complete'],
    ['noShow', 'markNoShow'],
  ] as const)(
    'ejecuta %s sobre una cita',
    async (controllerMethod, serviceMethod) => {
      const expected = { _id: 'appointment-1' };
      service[serviceMethod].mockResolvedValue(expected as never);

      await expect(
        controller[controllerMethod]('appointment-1'),
      ).resolves.toEqual(expected);
      expect(service[serviceMethod]).toHaveBeenCalledWith('appointment-1');
    },
  );
});
