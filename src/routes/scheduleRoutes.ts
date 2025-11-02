import { Router } from "express";
import { scheduleController } from "../controllers/scheduleController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /schedule/me:
 *   get:
 *     summary: Get authenticated barber's weekly schedule
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weekStart
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Weekly schedule
 */
router.get(
  "/me",
  authenticate,
  authorize("BARBER", "ADMIN"),
  scheduleController.getMySchedule
);

/**
 * @swagger
 * /schedule/barber/{barberId}:
 *   get:
 *     summary: Get barber weekly schedule by barberId (public)
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: barberId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: weekStart
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Weekly schedule
 */
router.get("/barber/:barberId", scheduleController.getBarberSchedule);

/**
 * @swagger
 * /schedule:
 *   put:
 *     summary: Update authenticated barber's schedule
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 day:
 *                   type: string
 *                 startTime:
 *                   type: string
 *                 endTime:
 *                   type: string
 *                 isOff:
 *                   type: boolean
 *     responses:
 *       200:
 *         description: Schedule updated
 */
router.put(
  "/",
  authenticate,
  authorize("BARBER", "ADMIN"),
  scheduleController.updateSchedule
);

export default router;
