import { Router } from "express";
import { bookingController } from "../controllers/bookingController";
import { authenticate } from "../middleware/auth";
import { authorizeBookingOwner } from "../middleware/authorizeResource";
import {
  validateCreateBooking,
  validateUpdateBookingStatus,
  validateGetBookingsQuery,
  validateRescheduleBooking,
  validateBulkUpdateStatus,
} from "../validators/bookingValidators";

const router = Router();

// All booking routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - barberId
 *               - serviceId
 *               - date
 *               - startTime
 *             properties:
 *               barberId:
 *                 type: string
 *                 format: uuid
 *               serviceId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 example: "14:00"
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request - time slot not available
 */
router.post("/", validateCreateBooking, bookingController.createBooking);

/**
 * @swagger
 * /bookings/my-bookings:
 *   get:
 *     summary: Get user's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: User bookings
 */
router.get(
  "/my-bookings",
  validateGetBookingsQuery,
  bookingController.getMyBookings
);

/**
 * @swagger
 * /bookings/barber/{id}:
 *   get:
 *     summary: Get barber's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Barber's bookings
 */
router.get("/barber/:id", bookingController.getBarberBookings);

/**
 * @swagger
 * /bookings/me/barber:
 *   get:
 *     summary: Get authenticated barber's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Barber's bookings
 */
router.get(
  "/me/barber",
  validateGetBookingsQuery,
  bookingController.getMyBarberBookings
);

/**
 * @swagger
 * /bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Booking status updated
 */
router.patch(
  "/:id/status",
  authorizeBookingOwner,
  validateUpdateBookingStatus,
  bookingController.updateBookingStatus
);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Cancel booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled
 */
router.delete("/:id", authorizeBookingOwner, bookingController.cancelBooking);

/**
 * @swagger
 * /bookings/{id}/reschedule:
 *   patch:
 *     summary: Reschedule booking (change date/time)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - startTime
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 example: "15:00"
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking rescheduled
 */
router.patch(
  "/:id/reschedule",
  authorizeBookingOwner,
  validateRescheduleBooking,
  bookingController.rescheduleBooking
);

/**
 * @swagger
 * /bookings/bulk-status:
 *   patch:
 *     summary: Bulk update booking statuses
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingIds
 *               - status
 *             properties:
 *               bookingIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bookings updated
 */
router.patch(
  "/bulk-status",
  validateBulkUpdateStatus,
  bookingController.bulkUpdateStatus
);

// All booking routes are protected
// Note: authenticate is applied to each route individually above
export default router;
