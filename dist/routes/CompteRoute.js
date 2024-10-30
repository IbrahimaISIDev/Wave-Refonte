import { Router } from "express";
const compteRoute = (compteController) => {
    const router = Router();
    router.post("/create", (req, res) => compteController.createCompte(req, res));
    router.put("/status/:id", (req, res) => compteController.updateCompteStatus(req, res));
    return router;
};
export default compteRoute;
//# sourceMappingURL=CompteRoute.js.map