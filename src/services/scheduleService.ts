import { prisma } from "../config/database";
import { NotFoundError, ValidationError } from "../errors/AppError";

export class ScheduleService {
  // Helper function to generate all time slots between startTime and endTime (in 20-minute intervals)
  // Includes startTime and endTime if they align with 20-minute intervals
  private generateTimeSlotsBetween(startTime: string, endTime: string): string[] {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    // Convert to total minutes for easier comparison
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = endHour * 60 + endMin;
    
    // Generate slots in 20-minute intervals from startTime to endTime (inclusive)
    // We'll add all slots that fall within the range, including exact start and end times
    let currentTotalMinutes = startTotalMinutes;
    
    while (currentTotalMinutes <= endTotalMinutes) {
      const currentHour = Math.floor(currentTotalMinutes / 60);
      const currentMin = currentTotalMinutes % 60;
      const timeStr = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
      slots.push(timeStr);
      
      // Increment by 20 minutes
      currentTotalMinutes += 20;
    }
    
    // Always include endTime if it's not already in the list (for cases where endTime is not a multiple of 20)
    // This ensures the entire duration is blocked
    if (!slots.includes(endTime)) {
      slots.push(endTime);
      slots.sort(); // Sort to keep chronological order
    }
    
    return slots;
  }
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

      // Generate all possible time slots (20-minute intervals)
      const allTimeSlots: string[] = [];
      if (daySchedule) {
        const startHour = parseInt(daySchedule.startTime.split(":")[0]);
        const endHour = parseInt(daySchedule.endTime.split(":")[0]);
        const lunchStart = daySchedule.lunchStart
          ? parseInt(daySchedule.lunchStart.split(":")[0])
          : 13;
        const lunchEnd = daySchedule.lunchEnd
          ? parseInt(daySchedule.lunchEnd.split(":")[0])
          : 14;

        // Generate all time slots in 20-minute intervals
        for (let hour = startHour; hour < endHour; hour++) {
          for (let min = 0; min < 60; min += 20) {
            // Skip if this time slot is during lunch break
            if (hour >= lunchStart && hour < lunchEnd) continue;
            
            const timeStr = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
            
            // Check if this time slot is after endTime
            const [endH, endM] = daySchedule.endTime.split(":").map(Number);
            if (hour > endH || (hour === endH && min >= endM)) break;
            
            allTimeSlots.push(timeStr);
          }
        }
      }

      // Calculate all booked time slots from bookings (startTime to endTime)
      const bookedSlots = new Set<string>();
      // Also store booking ranges for UI display (startTime-endTime format)
      const bookedRanges: Array<{ start: string; end: string }> = [];
      
      dayBookings.forEach((booking) => {
        if (booking.startTime && booking.endTime) {
          const startTimeFormatted = booking.startTime.substring(0, 5);
          const endTimeFormatted = booking.endTime.substring(0, 5);
          
          // Store range for UI display
          bookedRanges.push({
            start: startTimeFormatted,
            end: endTimeFormatted,
          });
          
          // Generate all slots between startTime and endTime for blocking
          const slots = this.generateTimeSlotsBetween(
            startTimeFormatted,
            endTimeFormatted
          );
          slots.forEach((slot) => bookedSlots.add(slot));
        }
      });

      // Create time slots with availability
      const timeSlots = allTimeSlots.map((timeStr) => ({
        time: timeStr,
        available: !bookedSlots.has(timeStr),
      }));

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
        booked: Array.from(bookedSlots).sort(), // All booked slots for checking availability
        bookedRanges: bookedRanges, // Booking ranges in format [{start: "09:00", end: "09:40"}, ...]
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
