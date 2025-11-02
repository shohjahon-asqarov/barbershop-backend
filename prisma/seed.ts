import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create users
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Super Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@barbershop.com" },
    update: {},
    create: {
      email: "admin@barbershop.com",
      phone: "+998900000001",
      password: hashedPassword,
      firstName: "Super",
      lastName: "Admin",
      role: "ADMIN",
    },
  });

  console.log("✅ Super Admin created: admin@barbershop.com / password123");

  const user1 = await prisma.user.upsert({
    where: { email: "user1@example.com" },
    update: {},
    create: {
      email: "user1@example.com",
      phone: "+998901234567",
      password: hashedPassword,
      firstName: "John",
      lastName: "Doe",
      role: "USER",
    },
  });

  const barberUser = await prisma.user.upsert({
    where: { email: "barber1@example.com" },
    update: {},
    create: {
      email: "barber1@example.com",
      phone: "+998901234568",
      password: hashedPassword,
      firstName: "Alex",
      lastName: "Smith",
      role: "BARBER",
    },
  });

  const barberUser2 = await prisma.user.upsert({
    where: { email: "barber2@example.com" },
    update: {},
    create: {
      email: "barber2@example.com",
      phone: "+998901234569",
      password: hashedPassword,
      firstName: "Amir",
      lastName: "Karimov",
      role: "BARBER",
    },
  });

  console.log("✅ Users created");

  // Create barbers
  // Check if barber already exists
  const existingBarber1 = await prisma.barber.findUnique({
    where: { userId: barberUser.id },
  });

  const barber1 =
    existingBarber1 ||
    (await prisma.barber.create({
      data: {
        userId: barberUser.id,
        bio: "Professional barber with 10 years of experience. Specializing in classic and modern cuts.",
        specialty: "Classic cuts",
        experience: 10,
        rating: 4.9,
        totalReviews: 127,
        location: "Chilonzor tumani, Toshkent",
        latitude: 41.2995,
        longitude: 69.2401,
        image:
          "https://images.unsplash.com/photo-1747832512459-5566e6d0ee5a?w=400",
        portfolio: [
          "https://images.unsplash.com/photo-1630411997548-24ab48df1678?w=400",
          "https://images.unsplash.com/photo-1672761431773-ae6e2d054493?w=400",
        ],
        isAvailable: true,
        workingDays: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ],
      },
    }));

  const existingBarber2 = await prisma.barber.findUnique({
    where: { userId: barberUser2.id },
  });

  const barber2 =
    existingBarber2 ||
    (await prisma.barber.create({
      data: {
        userId: barberUser2.id,
        bio: "Modern style specialist with 8 years of experience. Expert in contemporary hairstyles.",
        specialty: "Modern styles",
        experience: 8,
        rating: 4.8,
        totalReviews: 93,
        location: "Yakkasaroy tumani, Toshkent",
        latitude: 41.2996,
        longitude: 69.2402,
        image:
          "https://images.unsplash.com/photo-1630411997548-24ab48df1678?w=400",
        portfolio: [
          "https://images.unsplash.com/photo-1656921350153-b6389adaad57?w=400",
          "https://images.unsplash.com/photo-1759134198561-e2041049419c?w=400",
        ],
        isAvailable: true,
        workingDays: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ],
      },
    }));

  console.log("✅ Barbers created");

  // Create services for barber1
  const service1 = await prisma.service.create({
    data: {
      barberId: barber1.id,
      name: "Soch kesish",
      description: "Professional hair cutting",
      duration: 30,
      price: 50000,
    },
  });

  const service2 = await prisma.service.create({
    data: {
      barberId: barber1.id,
      name: "Soqol olish",
      description: "Beard trimming",
      duration: 20,
      price: 30000,
    },
  });

  const service3 = await prisma.service.create({
    data: {
      barberId: barber1.id,
      name: "Soch + Soqol",
      description: "Hair cut and beard trim",
      duration: 45,
      price: 70000,
    },
  });

  const service4 = await prisma.service.create({
    data: {
      barberId: barber2.id,
      name: "Premium to'plam",
      description: "Premium full service",
      duration: 60,
      price: 120000,
    },
  });

  console.log("✅ Services created");

  // Create schedules
  for (const day of [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ]) {
    await prisma.schedule.upsert({
      where: { barberId_day: { barberId: barber1.id, day } },
      update: {},
      create: {
        barberId: barber1.id,
        day,
        startTime: "09:00",
        endTime: "18:00",
        isWorking: true,
      },
    });

    await prisma.schedule.upsert({
      where: { barberId_day: { barberId: barber2.id, day } },
      update: {},
      create: {
        barberId: barber2.id,
        day,
        startTime: "10:00",
        endTime: "19:00",
        isWorking: true,
      },
    });
  }

  console.log("✅ Schedules created");

  // Create sample bookings
  const booking1 = await prisma.booking.create({
    data: {
      userId: user1.id,
      barberId: barber1.id,
      serviceId: service1.id,
      date: new Date("2024-12-15"),
      startTime: "14:00",
      endTime: "14:30",
      status: "CONFIRMED",
      notes: "First visit",
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      userId: user1.id,
      barberId: barber2.id,
      serviceId: service4.id,
      date: new Date("2024-12-20"),
      startTime: "15:00",
      endTime: "16:00",
      status: "PENDING",
    },
  });

  console.log("✅ Bookings created");

  // Create reviews
  await prisma.review.create({
    data: {
      userId: user1.id,
      barberId: barber1.id,
      bookingId: booking1.id,
      rating: 5,
      comment: "Excellent service! Very professional and friendly.",
    },
  });

  console.log("✅ Reviews created");

  // Create favorites
  await prisma.favorite.upsert({
    where: { userId_barberId: { userId: user1.id, barberId: barber1.id } },
    update: {},
    create: {
      userId: user1.id,
      barberId: barber1.id,
    },
  });

  await prisma.favorite.upsert({
    where: { userId_barberId: { userId: user1.id, barberId: barber2.id } },
    update: {},
    create: {
      userId: user1.id,
      barberId: barber2.id,
    },
  });

  console.log("✅ Favorites created");

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
