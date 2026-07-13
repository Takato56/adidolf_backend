import { Router } from 'express';
import { CRUD_RESOURCES } from '../config/resource.config.js';
import { createCrudController } from '../controllers/crud.controller.js';

const router = Router();

router.get('/', (_req, res) => {
    res.json({
        status: 'success',
        data: CRUD_RESOURCES.map((resource) => ({
            name: resource.name,
            path: `/admin${resource.routePath}`,
            table: resource.table,
            primaryKey: resource.primaryKey
        }))
    });
});

CRUD_RESOURCES.forEach((resource) => {
    const controller = createCrudController(resource);

    router
        .route(resource.routePath)
        .get(controller.list)
        .post(controller.create);

    router
        .route(`${resource.routePath}/:id`)
        .get(controller.getById)
        .put(controller.update)
        .patch(controller.update)
        .delete(controller.delete);
});

export default router;
