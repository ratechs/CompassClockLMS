// routes/institutionRoutes.js
import express from 'express';
import {
  createInstitution,
  getAllInstitutions,
  getInstitutionById,
  updateInstitution,
  deleteInstitution,
  getInstitutionsForManagement
} from '../controllers/institutionController.js';

const router = express.Router();

router.post('/', createInstitution);
router.get('/', getAllInstitutions);
router.get('/:id', getInstitutionById);
router.put('/:id', updateInstitution);
router.delete('/:id', deleteInstitution);
router.get('/managment/:user_id', getInstitutionsForManagement)

export default router;
