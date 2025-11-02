import { prisma } from "../config/database";
import { NotFoundError, ValidationError } from "../errors/AppError";

export class ScheduleService {
  async getBarberScheduleByUserId(userId: string, weekStart?: Date) {
    // Find barber by userId
    const barber = await prisma.barber.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      throw new NotFoundError("Barber profile topilmadi");
    }

    return this.getBarberSchedule(barber.id, weekStart);
  }

  async getBarberSchedule(barberId: string, weekStart?: Date) {
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barber) {
      throw new NotFoundError("Barber not found");
    }

    const now = new Date();
    const startDate =
      weekStart ||
      (() => {
        const date = new Date(now);
        date.setDate(date.getDate() - date.getDay());
        date.setHours(0, 0, 0, 0);
        return date;
      })();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    // Get schedules for the week
    const schedules = await prisma.schedule.findMany({
      where: {
        barberId,
        day: {
          in: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
      },
    });

    // Get bookings for this week
    const bookings = await prisma.booking.findMany({
      where: {
        barberId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        service: true,
      },
    });

    // Generate week schedule
    const daysOfWeek = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const weekSchedule = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dayName = daysOfWeek[i];
      const daySchedule = schedules.find((s) => s.day === dayName);

      // Get bookings for this day
      const dayBookings = bookings.filter((b) => {
        const bookingDate = new Date(b.date);
        return (
          bookingDate.getDate() === currentDate.getDate() &&
          bookingDate.getMonth() === currentDate.getMonth() &&
          bookingDate.getFullYear() === currentDate.getFullYear()
        );
      });

      // Generate time slots
      const timeSlots = [];
      if (daySchedule) {
        const startHour = parseInt(daySchedule.startTime.split(":")[0]);
        const endHour = parseInt(daySchedule.endTime.split(":")[0]);

        const lunchStart = daySchedule.lunchStart
          ? parseInt(daySchedule.lunchStart.split(":")[0])
          : 13;
        const lunchEnd = daySchedule.lunchEnd
          ? parseInt(daySchedule.lunchEnd.split(":")[0])
          : 14;

        for (let hour = startHour; hour < endHour; hour++) {
          const timeStr = `${hour.toString().padStart(2, "0")}:00`;
          const isBooked = dayBookings.some((b) =>
            b.startTime.startsWith(`${hour}:`)
          );

          // Skip lunch time
          if (hour >= lunchStart && hour < lunchEnd) continue;

          timeSlots.push({
            time: timeStr,
            available: !isBooked,
          });
        }
      }

      const dayNames = [
        "Yakshanba",
        "Dushanba",
        "Seshanba",
        "Chorshanba",
        "Payshanba",
        "Juma",
        "Shanba",
      ];

      const monthNames = [
        "Yanvar",
        "Fevral",
        "Mart",
        "Aprel",
        "May",
        "Iyun",
        "Iyul",
        "Avgust",
        "Sentabr",
        "Oktabr",
        "Noyabr",
        "Dekabr",
      ];

      weekSchedule.push({
        day: dayNames[currentDate.getDay()],
        date: `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`,
        dayOfWeek: dayName,
        isOff: !daySchedule,
        times: timeSlots.map((ts) => ts.time),
        booked: dayBookings.map((b) => b.startTime.substring(0, 5)),
        startTime: daySchedule?.startTime || undefined,
        endTime: daySchedule?.endTime || undefined,
        lunchBreak: {
          start: daySchedule?.lunchStart || "13:00",
          end: daySchedule?.lunchEnd || "14:00",
        },
      });
    }

    return weekSchedule;
  }

  async updateBarberScheduleByUserId(
    userId: string,
    scheduleData: {
      day: string;
      startTime: string;
      endTime: string;
      lunchStart?: string;
      lunchEnd?: string;
      isOff: boolean;
    }[]
  ) {
    // Find barber by userId
    const barber = await prisma.barber.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      throw new NotFoundError("Barber profile topilmadi");
    }

    return this.updateBarberSchedule(barber.id, scheduleData);
  }

  async updateBarberSchedule(
    barberId: string,
    scheduleData: {
      day: string;
      startTime: string;
      endTime: string;
      lunchStart?: string;
      lunchEnd?: string;
      isOff: boolean;
    }[]
  ) {
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barber) {
      throw new NotFoundError("Barber not found");
    }

    // Delete existing schedules
    await prisma.schedule.deleteMany({
      where: { barberId },
    });

    // Create new schedules
    for (const schedule of scheduleData) {
      if (!schedule.isOff) {
        await prisma.schedule.create({
          data: {
            barberId,
            day: schedule.day,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            lunchStart: schedule.lunchStart || null,
            lunchEnd: schedule.lunchEnd || null,
          },
        });
      }
    }

    return { message: "Schedule updated successfully" };
  }
}
