import express from "express";
import isAuth from "../middleware/isAuth";

import * as TagController from "../controllers/TagController";

const tagRoutes = express.Router();

tagRoutes.get("/tags/list", isAuth, TagController.list);
tagRoutes.get("/tags", isAuth, TagController.index);
tagRoutes.get("/tags/kanban", isAuth, TagController.kanban); // Busca dados do Kanban
tagRoutes.post("/tags", isAuth, TagController.store);
tagRoutes.put("/tags/:tagId", isAuth, TagController.update);
tagRoutes.get("/tags/:tagId", isAuth, TagController.show);
tagRoutes.delete("/tags/:tagId", isAuth, TagController.remove);

// Rota antiga (Mantida para não quebrar outras partes do sistema)
tagRoutes.post("/tags/sync", isAuth, TagController.syncTags);

// ===> NOVA ROTA EXCLUSIVA PARA ORDENAÇÃO DO KANBAN <===
// Alteramos o caminho para evitar o conflito
tagRoutes.post("/tags/sync-kanban", isAuth, TagController.syncKanbanTags);

export default tagRoutes;