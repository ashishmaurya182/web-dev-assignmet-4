const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Event = require('../models/Event');

const seedDemoData = async () => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
  const studentPassword = process.env.DEMO_STUDENT_PASSWORD;
  if (!adminPassword || !studentPassword) {
    console.info('[EventEase] Demo data skipped; set demo passwords in the local backend environment to enable it.');
    return;
  }

  console.info('[EventEase] Seeding local demo users and events.');

  const adminExists = await User.findOne({ email: 'admin@eventease.com' });
  const studentExists = await User.findOne({ email: 'student@eventease.com' });

  if (!adminExists) {
    await User.create({
      name: 'EventEase Admin',
      email: 'admin@eventease.com',
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: 'admin',
    });
  }

  if (!studentExists) {
    await User.create({
      name: 'Demo Student',
      email: 'student@eventease.com',
      passwordHash: await bcrypt.hash(studentPassword, 10),
      role: 'student',
    });
  }

  const adminUser = await User.findOne({ email: 'admin@eventease.com' });
  const eventCount = await Event.countDocuments();

  if (eventCount === 0 && adminUser) {
    const demoEvents = [
      {
        title: 'TechFest 2026',
        description: 'A flagship technology festival featuring workshops, demos, and innovation showcases.',
        category: 'Technical',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8),
        startTime: '10:00',
        endTime: '17:00',
        venue: 'Innovation Hall',
        organizer: 'Computer Science Club',
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
        capacity: 120,
        status: 'upcoming',
        createdBy: adminUser._id,
      },
      {
        title: 'AI & Machine Learning Workshop',
        description: 'Hands-on session exploring practical ML models, datasets, and deployment basics.',
        category: 'Workshop',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
        startTime: '11:30',
        endTime: '13:00',
        venue: 'Smart Lab 2',
        organizer: 'AI Research Center',
        imageUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1200&q=80',
        capacity: 60,
        status: 'upcoming',
        createdBy: adminUser._id,
      },
      {
        title: 'Cultural Night',
        description: 'An evening of dance, music, and performances celebrating campus culture.',
        category: 'Cultural',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20),
        startTime: '18:00',
        endTime: '22:00',
        venue: 'Main Auditorium',
        organizer: 'Cultural Committee',
        imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
        capacity: 200,
        status: 'upcoming',
        createdBy: adminUser._id,
      },
    ];

    await Event.insertMany(demoEvents);
  }

  const seededUserCount = await User.countDocuments();
  const seededEventCount = await Event.countDocuments();
  console.info(`[EventEase] Local demo ready: ${seededUserCount} users, ${seededEventCount} events.`);
};

module.exports = { seedDemoData };
