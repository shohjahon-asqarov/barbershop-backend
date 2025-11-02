import { Router } from "express";
import { notificationController } from "../controllers/notificationController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Limit results
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get(
  "/",
  authenticate,
  notificationController.getMyNotifications
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch(
  "/:id/read",
  authenticate,
  notificationController.markAsRead
);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch(
  "/read-all",
  authenticate,
  notificationController.markAllAsRead
);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete(
  "/:id",
  authenticate,
  notificationController.deleteNotification
);

export default router;

