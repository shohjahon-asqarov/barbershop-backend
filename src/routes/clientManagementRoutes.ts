import { Router } from "express";
import { clientManagementController } from "../controllers/clientManagementController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Get barber's clients list
 *     tags: [Client Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search clients by name or phone
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Limit results
 *     responses:
 *       200:
 *         description: List of clients
 */
router.get(
  "/",
  authenticate,
  authorize("BARBER", "ADMIN"),
  clientManagementController.getMyClients
);

/**
 * @swagger
 * /clients/{clientId}:
 *   get:
 *     summary: Get client detail with history
 *     tags: [Client Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client detail with statistics and history
 */
router.get(
  "/:clientId",
  authenticate,
  authorize("BARBER", "ADMIN"),
  clientManagementController.getClientDetail
);

/**
 * @swagger
 * /clients/{clientId}/note:
 *   put:
 *     summary: Create or update client note
 *     tags: [Client Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Client note updated
 */
router.put(
  "/:clientId/note",
  authenticate,
  authorize("BARBER", "ADMIN"),
  clientManagementController.upsertClientNote
);

/**
 * @swagger
 * /clients/{clientId}/note:
 *   delete:
 *     summary: Delete client note
 *     tags: [Client Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client note deleted
 */
router.delete(
  "/:clientId/note",
  authenticate,
  authorize("BARBER", "ADMIN"),
  clientManagementController.deleteClientNote
);

export default router;

