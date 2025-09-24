import {Router} from 'express';
import * as HelpController from '../controllers/help.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/help-requests', HelpController.createHelpRequest);
router.get('/help-requests/ticket/:ticketNumber', HelpController.getHelpRequestByTicket);

//user route
router.use(verifyToken);

router.get('/help-requests/my', HelpController.getMyHelpRequests);

//admin route
router.get('/help-requests', HelpController.getHelpRequests);

//specific route
router.get('/help-requests/:id', HelpController.getHelpRequestById);
router.put('/help-requests/:id', HelpController.updateHelpRequest);

export default router;