import { Router } from "express";
import { servicesController } from "../controllers/servicesController";
import { authenticate, authorize } from "../middleware/auth";
import { authorizeServiceOwner } from "../middleware/authorizeResource";
import {
  validateCreateService,
  validateUpdateService,
  validateGetBarberServices,
} from "../validators/serviceValidators";

const router = Router();

/**
 * @swagger
 * /services/me:
 *   get:
 *     summary: Get authenticated barber's services
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of services
 */
router.get(
  "/me",
  authenticate,
  authorize("BARBER", "ADMIN"),
  servicesController.getMyServices
);

/**
 * @swagger
 * /services/barber/{barberId}:
 *   get:
 *     summary: Get barber services by barberId (public)
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: barberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of services
 */
router.get(
  "/barber/:barberId",
  validateGetBarberServices,
  servicesController.getBarberServices
);

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Create service for authenticated barber
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: number
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Service created
 */
router.post(
  "/",
  authenticate,
  authorize("BARBER", "ADMIN"),
  validateCreateService,
  servicesController.createService
);

/**
 * @swagger
 * /services/{id}:
 *   patch:
 *     summary: Update service
 *     tags: [Services]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: number
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Service updated
 */
router.patch(
  "/:id",
  authenticate,
  authorizeServiceOwner,
  validateUpdateService,
  servicesController.updateService
);

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     summary: Delete service
 *     tags: [Services]
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
 *         description: Service deleted
 */
router.delete(
  "/:id",
  authenticate,
  authorizeServiceOwner,
  servicesController.deleteService
);

export default router;
