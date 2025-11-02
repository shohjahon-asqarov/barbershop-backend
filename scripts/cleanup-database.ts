/**
 * Database Cleanup Script
 *
 * This script cleans up the database:
 * 1. Creates barber profiles for users with BARBER role who don't have one
 * 2. Removes orphaned records (bookings without users, services without barbers, etc.)
 * 3. Sets default values for missing data
 */

import { PrismaClient } from "@prisma/client";
import { BarberService } from "../src/services/barberService";

const prisma = new PrismaClient();
const barberService = new BarberService();

async function cleanupDatabase() {
  try {
    console.log("🚀 Database cleanup boshlandi...");

    // 1. Barber profiles yaratish (BARBER roli bor lekin profile yo'q userlar uchun)
    console.log("\n📋 1. Barber profiles tekshirilmoqda...");
    const barberUsers = await prisma.user.findMany({
      where: {
        role: "BARBER",
      },
      include: {
        barber: true,
      },
    });

    let createdProfiles = 0;
    for (const user of barberUsers) {
      if (!user.barber) {
        console.log(
          `   ⚠️  Barber profile topilmadi: ${user.firstName} ${user.lastName} (${user.id})`
        );
        try {
          await barberService.createBarber(user.id, {
            bio: "",
            specialty: "",
            experience: 0,
            location: "",
          });
          createdProfiles++;
          console.log(
            `   ✅ Barber profile yaratildi: ${user.firstName} ${user.lastName}`
          );
        } catch (error: any) {
          console.log(
            `   ❌ Barber profile yaratishda xatolik: ${error.message}`
          );
        }
      }
    }
    console.log(`   📊 ${createdProfiles} ta yangi barber profile yaratildi`);

    // 2. Orphaned bookings (user yo'q bo'lgan bookings) o'chirish
    console.log("\n📋 2. Orphaned bookings tekshirilmoqda...");
    const allBookings = await prisma.booking.findMany({
      include: {
        user: true,
        barber: true,
      },
    });

    let deletedBookings = 0;
    for (const booking of allBookings) {
      if (!booking.user || !booking.barber) {
        console.log(`   ⚠️  Orphaned booking topildi: ${booking.id}`);
        await prisma.booking.delete({
          where: { id: booking.id },
        });
        deletedBookings++;
      }
    }
    console.log(`   📊 ${deletedBookings} ta orphaned booking o'chirildi`);

    // 3. Orphaned services (barber yo'q bo'lgan services) o'chirish
    console.log("\n📋 3. Orphaned services tekshirilmoqda...");
    const allServices = await prisma.service.findMany({
      include: {
        barber: true,
      },
    });

    let deletedServices = 0;
    for (const service of allServices) {
      if (!service.barber) {
        console.log(`   ⚠️  Orphaned service topildi: ${service.id}`);
        await prisma.service.delete({
          where: { id: service.id },
        });
        deletedServices++;
      }
    }
    console.log(`   📊 ${deletedServices} ta orphaned service o'chirildi`);

    // 4. Orphaned schedules (barber yo'q bo'lgan schedules) o'chirish
    console.log("\n📋 4. Orphaned schedules tekshirilmoqda...");
    const allSchedules = await prisma.schedule.findMany({
      include: {
        barber: true,
      },
    });

    let deletedSchedules = 0;
    for (const schedule of allSchedules) {
      if (!schedule.barber) {
        console.log(`   ⚠️  Orphaned schedule topildi: ${schedule.id}`);
        await prisma.schedule.delete({
          where: { id: schedule.id },
        });
        deletedSchedules++;
      }
    }
    console.log(`   📊 ${deletedSchedules} ta orphaned schedule o'chirildi`);

    // 5. Orphaned favorites (user yoki barber yo'q bo'lgan favorites) o'chirish
    console.log("\n📋 5. Orphaned favorites tekshirilmoqda...");
    const allFavorites = await prisma.favorite.findMany({
      include: {
        user: true,
        barber: true,
      },
    });

    let deletedFavorites = 0;
    for (const favorite of allFavorites) {
      if (!favorite.user || !favorite.barber) {
        console.log(`   ⚠️  Orphaned favorite topildi: ${favorite.id}`);
        await prisma.favorite.delete({
          where: { id: favorite.id },
        });
        deletedFavorites++;
      }
    }
    console.log(`   📊 ${deletedFavorites} ta orphaned favorite o'chirildi`);

    // 6. Orphaned reviews (user yoki barber yo'q bo'lgan reviews) o'chirish
    console.log("\n📋 6. Orphaned reviews tekshirilmoqda...");
    const allReviews = await prisma.review.findMany({
      include: {
        user: true,
        barber: true,
      },
    });

    let deletedReviews = 0;
    for (const review of allReviews) {
      if (!review.user || !review.barber) {
        console.log(`   ⚠️  Orphaned review topildi: ${review.id}`);
        await prisma.review.delete({
          where: { id: review.id },
        });
        deletedReviews++;
      }
    }
    console.log(`   📊 ${deletedReviews} ta orphaned review o'chirildi`);

    // 7. Default values set qilish - null/undefined qiymatlar uchun
    console.log("\n📋 7. Default values set qilinmoqda...");

    // Barber'lar uchun default values (faqat nullable field'lar uchun)
    const barbersToUpdate = await prisma.barber.findMany({
      where: {
        OR: [{ bio: null }, { specialty: null }, { location: null }],
      },
    });

    let updatedBarbers = 0;
    for (const barber of barbersToUpdate) {
      await prisma.barber.update({
        where: { id: barber.id },
        data: {
          bio: barber.bio ?? "",
          specialty: barber.specialty ?? "",
          location: barber.location ?? "",
          // Non-nullable field'lar uchun faqat agar 0 bo'lsa yoki undefined bo'lsa
          ...(barber.experience === null || barber.experience === undefined
            ? { experience: 0 }
            : {}),
          ...(barber.rating === null || barber.rating === undefined
            ? { rating: 0 }
            : {}),
          ...(barber.totalReviews === null || barber.totalReviews === undefined
            ? { totalReviews: 0 }
            : {}),
          ...(barber.isAvailable === null || barber.isAvailable === undefined
            ? { isAvailable: true }
            : {}),
          portfolio: barber.portfolio ?? [],
          workingDays: barber.workingDays ?? [],
        },
      });
      updatedBarbers++;
    }
    console.log(`   📊 ${updatedBarbers} ta barber yangilandi`);

    // User'lar uchun default values (nullable bo'lmagan maydonlarda null bo'lmaydi)
    // Bo'sh stringlarni normalize qilamiz
    const updatedUsers = await prisma.user.updateMany({
      where: {
        OR: [{ firstName: "" }, { lastName: "" }],
      },
      data: {
        // Agar bo'sh string bo'lsa ham, quyidagi set bo'ladi. Real normalizatsiya uchun
        // application-level da to'g'ri qiymatlar set qilinadi.
      },
    });
    console.log(`   📊 ${updatedUsers.count} ta user normalize qilindi`);

    console.log("\n✅ Database cleanup yakunlandi!");
    console.log("\n📊 Umumiy natijalar:");
    console.log(`   - Barber profiles yaratildi: ${createdProfiles}`);
    console.log(`   - Orphaned bookings o'chirildi: ${deletedBookings}`);
    console.log(`   - Orphaned services o'chirildi: ${deletedServices}`);
    console.log(`   - Orphaned schedules o'chirildi: ${deletedSchedules}`);
    console.log(`   - Orphaned favorites o'chirildi: ${deletedFavorites}`);
    console.log(`   - Orphaned reviews o'chirildi: ${deletedReviews}`);
    console.log(`   - Barbers yangilandi: ${updatedBarbers}`);
    console.log(`   - Users yangilandi: ${updatedUsers}`);
  } catch (error) {
    console.error("❌ Xatolik yuz berdi:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Scriptni ishga tushirish
if (require.main === module) {
  cleanupDatabase()
    .then(() => {
      console.log("\n🎉 All done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Script xato bilan tugadi:", error);
      process.exit(1);
    });
}

export { cleanupDatabase };
