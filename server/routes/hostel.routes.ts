import { Router } from 'express';
import {
  getHostels,
  createHostel,
  updateHostel,
  deleteHostel,
  getBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  getFloors,
  createFloor,
  updateFloor,
  deleteFloor,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getBeds,
  createBed,
  deleteBed,
  assignStudentToBed,
  updateBedStatus,
  getHostelHierarchy,
} from '../controllers/hostel.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  createHostelSchema,
  updateHostelSchema,
  createBlockSchema,
  updateBlockSchema,
  createFloorSchema,
  updateFloorSchema,
  createRoomSchema,
  updateRoomSchema,
  createBedSchema,
  assignBedSchema,
  updateBedStatusSchema
} from '../validations/hostel.validation';
import { UserRole } from '../models/User';

const router = Router();

// Infrastructure Management (Admin only)
router.get('/hostels', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), getHostels);
router.post('/hostels', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), validateRequest(createHostelSchema), createHostel);
router.put('/hostels/:id', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), validateRequest(updateHostelSchema), updateHostel);
router.delete('/hostels/:id', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), deleteHostel);

router.get('/blocks', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), getBlocks);
router.post('/blocks', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), validateRequest(createBlockSchema), createBlock);
router.put('/blocks/:id', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), validateRequest(updateBlockSchema), updateBlock);
router.delete('/blocks/:id', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), deleteBlock);

router.get('/floors', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), getFloors);
router.post('/floors', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), validateRequest(createFloorSchema), createFloor);
router.put('/floors/:id', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), validateRequest(updateFloorSchema), updateFloor);
router.delete('/floors/:id', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), deleteFloor);

router.get('/rooms', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), getRooms);
router.post('/rooms', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), validateRequest(createRoomSchema), createRoom);
router.put('/rooms/:id', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), validateRequest(updateRoomSchema), updateRoom);
router.delete('/rooms/:id', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), deleteRoom);

router.get('/beds', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), getBeds);
router.post('/beds', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), validateRequest(createBedSchema), createBed);
router.delete('/beds/:id', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), deleteBed);

// Bed Occupancy (Admin or Warden)
router.post('/beds/:bedId/assign', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), validateRequest(assignBedSchema), assignStudentToBed);
router.patch('/beds/:bedId/status', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), validateRequest(updateBedStatusSchema), updateBedStatus);

// Visual Hostel Map API
router.get('/hierarchy', authenticateJWT, getHostelHierarchy);

export default router;
