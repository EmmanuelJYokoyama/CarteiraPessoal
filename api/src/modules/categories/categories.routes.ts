import {FastifyInstance} from 'fastify';
import {
  listCategories,
  createNewCategory,
  getCategory,
  updateCategoryHandler,
  deleteCategoryHandler,
} from './categories.controller';

export async function categoriesRoutes(app: FastifyInstance) {
  app.get('/categories', listCategories);
  app.post('/categories', createNewCategory);
  app.get<{Params: {categoryId: string}}>('/categories/:categoryId', getCategory);
  app.put<{Params: {categoryId: string}}>('/categories/:categoryId', updateCategoryHandler);
  app.delete<{Params: {categoryId: string}}>('/categories/:categoryId', deleteCategoryHandler);
}
