import { Router } from "express";
import { reviewsController } from "../controllers/reviewsController";
import { authenticate } from "../middleware/auth";
import {
  validateCreateReview,
  validateGetReviewsQuery,
} from "../validators/reviewValidators";

const router = Router();

/**
 * @swagger
 * /reviews/barber/{barberId}:
 *   get:
 *     summary: Get barber reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: barberId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get(
  "/barber/:barberId",
  validateGetReviewsQuery,
  reviewsController.getBarberReviews
);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               barberId:
 *                 type: string
 *               bookingId:
 *                 type: string
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created
 */
router.post(
  "/",
  authenticate,
  validateCreateReview,
  reviewsController.createReview
);

/**
 * @swagger
 * /reviews/barber/{barberId}/stats:
 *   get:
 *     summary: Get review statistics
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: barberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review statistics
 */
router.get("/barber/:barberId/stats", reviewsController.getReviewStats);

export default router;
