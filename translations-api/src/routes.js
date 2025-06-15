import { Router } from "express";

import NotFound from "./routers/helpers/404.js";
import InternalServerError from "./routers/helpers/500.js";

import hateos from "./middlewares/hateos.js";
import handler from "./middlewares/handler.js";

import TranslationRouter from "./routers/translationRouter.js"


const routes = Router()
routes.use(hateos);
routes.use(handler);

routes.use("/api/translation", TranslationRouter)


routes.use(InternalServerError)
routes.use(NotFound);

export default routes;