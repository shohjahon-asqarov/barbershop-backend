import { Router } from "express";
import { statisticsController } from "../controllers/statisticsController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /statistics/me:
 *   get:
 *     summary: Get authenticated barber's statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Barber statistics
 */
router.get(
  "/me",
  authenticate,
  authorize("BARBER", "ADMIN"),
  statisticsController.getMyStatistics
);

/**
 * @swagger
 * /statistics/barber/{id}:
 *   get:
 *     summary: Get barber statistics by barberId (admin only)
 *     tags: [Statistics]
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
 *         description: Barber statistics
 */
router.get(
  "/barber/:id",
  authenticate,
  authorize("ADMIN"),
  statisticsController.getBarberStatistics
);

/**
 * @swagger
 * /statistics/barber/{id}/monthly:
 *   get:
 *     summary: Get monthly statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: months
 *         schema:
 *           type: number
 *           default: 6
 *     responses:
 *       200:
 *         description: Monthly statistics
 */
/**
 * @swagger
 * /statistics/me/monthly:
 *   get:
 *     summary: Get authenticated barber's monthly statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: number
 *           default: 6
 *     responses:
 *       200:
 *         description: Monthly statistics
 */
router.get(
  "/me/monthly",
  authenticate,
  authorize("BARBER", "ADMIN"),
  statisticsController.getMonthlyStats
);

/**
 * @swagger
 * /statistics/me/peak-hours:
 *   get:
 *     summary: Get authenticated barber's peak hours
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Peak hours data
 */
router.get(
  "/me/peak-hours",
  authenticate,
  authorize("BARBER", "ADMIN"),
  statisticsController.getPeakHours
);

export default router;
