import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      if (error && error.name === 'ZodError') {
        res.status(400).json({
          message: 'Validation failed',
          errors: Array.isArray(error.errors) ? error.errors.map((e: any) => ({
            path: e.path.join('.'),
            message: e.message
          })) : []
        });
        return;
      }
      next(error);
    }
  };
};
