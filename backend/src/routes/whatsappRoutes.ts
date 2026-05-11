import express from "express";
import isAuth from "../middleware/isAuth";

import * as WhatsAppController from "../controllers/WhatsAppController";

const whatsappRoutes = express.Router();

whatsappRoutes.get("/whatsapp/", isAuth, WhatsAppController.index);

whatsappRoutes.post("/whatsapp/", isAuth, WhatsAppController.store);

whatsappRoutes.get("/whatsapp/:whatsappId", isAuth, WhatsAppController.show);

whatsappRoutes.put("/whatsapp/:whatsappId", isAuth, WhatsAppController.update);

whatsappRoutes.delete("/whatsapp/:whatsappId", isAuth, WhatsAppController.remove);

// --- ADICIONE ESTAS LINHAS AQUI ---
// Rota antiga (global) - Mantenha por compatibilidade se quiser
whatsappRoutes.post("/whatsapp-restart/", isAuth, WhatsAppController.restart);

// NOVA ROTA (Específica por ID) - É ESSA QUE O FRONTEND ESTÁ CHAMANDO
whatsappRoutes.post("/whatsapp/restart/:whatsappId", isAuth, WhatsAppController.restart);
// ----------------------------------

export default whatsappRoutes;
