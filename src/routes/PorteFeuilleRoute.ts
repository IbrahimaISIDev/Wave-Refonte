import { Router } from 'express';
import PorteFeuilleController from '../controllers/PorteFeuilleController.js';

const router = Router();
router.post('/', async (req, res, next) => {
  await PorteFeuilleController.createWallet(req, res);
});
router.get('/', async (req, res, next) => {
  await PorteFeuilleController.getWallet(req, res);
});
router.get('/client', async (req, res, next) => {
  await PorteFeuilleController.getWalletByClient(req, res);
});
router.get('/service', async (req, res, next) => {
  await PorteFeuilleController.getWalletByService(req, res);
});
router.get('/operateur', async (req, res, next) => {
  await PorteFeuilleController.getWalletByOperateur(req, res);
});
router.get('/code', async (req, res, next) => {
  await PorteFeuilleController.getCodeWallet(req, res);
});
router.put('/access', async (req, res, next) => {
  await PorteFeuilleController.accessToWallet(req, res);
});
router.put('/open', async (req, res, next) => {
  await PorteFeuilleController.openWallet(req, res);
});

export default router;