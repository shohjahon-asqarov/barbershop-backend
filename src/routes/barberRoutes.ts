import { Router } from "express";
import { barberController } from "../controllers/barberController";
import { authenticate, authorize } from "../middleware/auth";
import { authorizeBarberOwner } from "../middleware/authorizeResource";
import {
  validateCreateBarber,
  validateUpdateBarber,
} from "../validators/barberValidators";
import {
  validateAddPortfolio,
  validateRemovePortfolio,
} from "../validators/barberValidators";

const router = Router();

/**
 * @swagger
 * /barbers:
 *   get:
 *     summary: Get all barbers with filters
 *     tags: [Barbers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, specialty, or location
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum rating
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [distance, rating, price]
 *         description: Sort by field
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of barbers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     barbers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           user:
 *                             $ref: '#/components/schemas/User'
 *                           rating:
 *                             type: number
 *                           totalReviews:
 *                             type: number
 *                           services:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/Service'
 *                     pagination:
 *                       type: object
 */
router.get("/", barberController.getAllBarbers);

/**
 * @swagger
 * /barbers/{id}:
 *   get:
 *     summary: Get barber by ID
 *     tags: [Barbers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Barber ID
 *     responses:
 *       200:
 *         description: Barber details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Barber'
 *       404:
 *         description: Barber not found
 */
// Place specific routes before dynamic :id to avoid conflicts
router.get(
  "/me",
  authenticate,
  authorize("BARBER", "ADMIN"),
  barberController.getMyProfile
);

router.get(
  "/dashboard",
  authenticate,
  authorize("BARBER", "ADMIN"),
  barberController.getDashboard
);

router.get("/:id", barberController.getBarberById);

/**
 * @swagger
 * /barbers/me:
 *   get:
 *     summary: Get authenticated barber profile
 *     tags: [Barbers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Barber details for the authenticated user
 */
// moved above

/**
 * @swagger
 * /barbers:
 *   post:
 *     summary: Create barber profile
 *     tags: [Barbers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               specialty:
 *                 type: string
 *               experience:
 *                 type: number
 *               location:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               image:
 *                 type: string
 *               portfolio:
 *                 type: array
 *                 items:
 *                   type: string
 *               workingDays:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Barber profile created
 *       400:
 *         description: Bad request
 */
router.post(
  "/",
  authenticate,
  authorize("USER", "BARBER", "ADMIN"),
  validateCreateBarber,
  barberController.createBarber
);

/**
 * @swagger
 * /barbers/me:
 *   patch:
 *     summary: Update authenticated barber's profile
 *     tags: [Barbers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               specialty:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Barber profile updated
 */
router.patch(
  "/me",
  authenticate,
  authorize("BARBER", "ADMIN"),
  validateUpdateBarber,
  barberController.updateMyProfile
);

/**
 * @swagger
 * /barbers/{id}:
 *   patch:
 *     summary: Update barber profile by id (admin or authorized)
 *     tags: [Barbers]
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
 *               bio:
 *                 type: string
 *               specialty:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Barber profile updated
 *       404:
 *         description: Barber not found
 */
router.patch(
  "/:id",
  authenticate,
  authorizeBarberOwner,
  validateUpdateBarber,
  barberController.updateBarber
);

/**
 * @swagger
 * /barbers/me/portfolio:
 *   post:
 *     summary: Add images to portfolio (max 20, dedup)
 *     tags: [Barbers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updated portfolio array
 */
router.post(
  "/me/portfolio",
  authenticate,
  authorize("BARBER", "ADMIN"),
  validateAddPortfolio,
  barberController.addPortfolioImages
);

/**
 * @swagger
 * /barbers/me/portfolio:
 *   delete:
 *     summary: Remove portfolio image by index or url
 *     tags: [Barbers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               index:
 *                 type: number
 *               url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated portfolio array
 */
router.delete(
  "/me/portfolio",
  authenticate,
  authorize("BARBER", "ADMIN"),
  validateRemovePortfolio,
  barberController.removePortfolioImage
);

/**
 * @swagger
 * /barbers/dashboard:
 *   get:
 *     summary: Get barber dashboard data
 *     tags: [Barbers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data with stats and upcoming bookings
 */
// moved above

export default router;
