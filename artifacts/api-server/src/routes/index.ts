import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import coursesRouter from "./courses";
import sectionsRouter from "./sections";
import lessonsRouter from "./lessons";
import enrollmentsRouter from "./enrollments";
import progressRouter from "./progress";
import adminUsersRouter from "./admin-users";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(coursesRouter);
router.use(sectionsRouter);
router.use(lessonsRouter);
router.use(enrollmentsRouter);
router.use(progressRouter);
router.use(adminUsersRouter);
router.use(storageRouter);

export default router;
