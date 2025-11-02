import { Router } from "express";
import { offersController } from "../controllers/offersController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /offers:
 *   get:
 *     summary: Get active offers
 *     tags: [Offers]
 *     parameters:
 *       - in: query
 *         name: barberId
 *         schema:
 *           type: string
 *         description: Filter offers by barber ID (optional)
 *     responses:
 *       200:
 *         description: List of active offers
 */
router.get("/", offersController.getActiveOffers);

/**
 * @swagger
 * /offers/{id}:
 *   get:
 *     summary: Get offer by ID
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Offer details
 */
router.get("/:id", offersController.getOfferById);

/**
 * @swagger
 * /offers:
 *   post:
 *     summary: Create new offer
 *     tags: [Offers]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               discount:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Offer created
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "BARBER"),
  offersController.createOffer
);

/**
 * @swagger
 * /offers/{id}:
 *   patch:
 *     summary: Update offer
 *     tags: [Offers]
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
 *         description: Offer updated
 */
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "BARBER"),
  offersController.updateOffer
);

/**
 * @swagger
 * /offers/{id}:
 *   delete:
 *     summary: Delete offer
 *     tags: [Offers]
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
 *         description: Offer deleted
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "BARBER"),
  offersController.deleteOffer
);

export default router;
