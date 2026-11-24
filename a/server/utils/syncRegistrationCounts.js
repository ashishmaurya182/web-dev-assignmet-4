const Event = require('../models/Event');
const Registration = require('../models/Registration');

const syncLegacyRegistrationCounts = async () => {
  const legacyEventCount = await Event.countDocuments({ registrationCount: { $exists: false } });
  if (!legacyEventCount) {
    return;
  }

  await Event.updateMany(
    { registrationCount: { $exists: false } },
    { $set: { registrationCount: 0 } }
  );

  const counts = await Registration.aggregate([
    { $group: { _id: '$event', count: { $sum: 1 } } },
  ]);

  if (counts.length) {
    await Event.bulkWrite(
      counts.map(({ _id, count }) => ({
        updateOne: {
          filter: { _id },
          update: { $set: { registrationCount: count } },
        },
      })),
      { ordered: false }
    );
  }
};

module.exports = { syncLegacyRegistrationCounts };
