"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const compteRoute = (compteController) => {
    const router = (0, express_1.Router)();
    router.post("/create", (req, res) => compteController.createCompte(req, res));
    // Ajoutez d'autres routes ici
    return router;
};
exports.default = compteRoute;
