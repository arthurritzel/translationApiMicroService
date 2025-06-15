import { Router } from "express";
import validator from "../middlewares/validator.js";
import translationValidator from "./translationValidator.js";
import { restrictToConsumer } from "../middlewares/networkRestriciton.js";

import { 
  createTranslation, 
  getTranslationStatus, 
  getAllTranslations, 
  updateTranslationStatus 
} from "../controllers/translationController.js";

const router = Router();

router.get("/", getAllTranslations);
router.get("/:requestId", getTranslationStatus);
router.post("/", validator(translationValidator), createTranslation);

router.put("/:requestId/status", restrictToConsumer, updateTranslationStatus);

export default router;