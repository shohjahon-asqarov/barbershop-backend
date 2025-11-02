import { Router } from "express";
import { favoritesController } from "../controllers/favoritesController";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /favorites:
 *   post:
 *     summary: Add barber to favorites
 *     tags: [Favorites]
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
 *     responses:
 *       201:
 *         description: Added to favorites
 */
router.post("/", authenticate, favoritesController.addToFavorites);

/**
 * @swagger
 * /favorites/{barberId}:
 *   delete:
 *     summary: Remove from favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Removed from favorites
 */
router.delete(
  "/:barberId",
  authenticate,
  favoritesController.removeFromFavorites
);

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Get user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite barbers
 */
router.get("/", authenticate, favoritesController.getMyFavorites);

export default router;
