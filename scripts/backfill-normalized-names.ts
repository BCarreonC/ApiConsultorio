import mongoose from 'mongoose';

import { normalizeText } from '../src/common/utils/text-normalizer.util';

async function main() {
  const mongoUri =
    process.env.MONGO_URI ?? 'mongodb://localhost:27017/medical_ai';

  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('No se pudo obtener la base de datos.');
  }

  const patients = db.collection('patients');

  const users = db.collection('users');

  const doctors = db.collection('doctors');

  const patientCursor = patients.find({});

  for await (const patient of patientCursor) {
    const normalizedName = normalizeText(
      `${patient.firstName ?? ''} ${patient.lastName ?? ''}`,
    );

    await patients.updateOne(
      {
        _id: patient._id,
      },
      {
        $set: {
          normalizedName,
        },
      },
    );

    console.log(
      '[PATIENT]',
      patient.firstName,
      patient.lastName,
      '->',
      normalizedName,
    );
  }

  const userCursor = users.find({});

  for await (const user of userCursor) {
    const normalizedFullName = normalizeText(user.fullName ?? '');

    const update: Record<string, unknown> = {
      normalizedFullName,
    };

    if (user.isActive === undefined) {
      update.isActive = true;
    }

    await users.updateOne(
      {
        _id: user._id,
      },
      {
        $set: update,
      },
    );

    console.log(
      '[USER]',
      user.fullName,
      '->',
      normalizedFullName,
      'active:',
      update.isActive ?? user.isActive,
    );
  }

  const doctorCursor = doctors.find({});

  for await (const doctor of doctorCursor) {
    if (doctor.isActive === undefined) {
      await doctors.updateOne(
        {
          _id: doctor._id,
        },
        {
          $set: {
            isActive: true,
          },
        },
      );
    }
  }

  console.log('Normalización completada.');

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);

  await mongoose.disconnect();

  process.exit(1);
});
