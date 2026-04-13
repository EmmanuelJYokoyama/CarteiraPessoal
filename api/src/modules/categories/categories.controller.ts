import {FastifyRequest, FastifyReply} from 'fastify';
import {createCategorySchema, updateCategorySchema} from './categories.schema';
import {
  createCategory,
  getCategoriesByUserId,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from './categories.service';
import type {AuthTokenPayload} from '../auth/auth.types';

export async function listCategories(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();

    const payload = req.user as AuthTokenPayload;
    const userCategories = await getCategoriesByUserId(payload.userId);

    return reply.send(userCategories);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    console.error('Erro ao listar categorias:', err);
    return reply.status(500).send({error: 'Erro ao listar categorias'});
  }
}

export async function createNewCategory(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();

    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({error: parsed.error.flatten()});
    }

    const payload = req.user as AuthTokenPayload;
    const category = await createCategory(payload.userId, parsed.data);

    return reply.status(201).send(category);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    console.error('Erro ao criar categoria:', err);
    return reply.status(500).send({error: 'Erro ao criar categoria'});
  }
}

export async function getCategory(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();

    const {categoryId} = req.params as {categoryId: string};
    const payload = req.user as AuthTokenPayload;

    const category = await getCategoryById(categoryId, payload.userId);

    return reply.send(category);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    if (err.message === 'CATEGORY_NOT_FOUND') {
      return reply.status(404).send({error: 'Categoria não encontrada'});
    }
    console.error('Erro ao buscar categoria:', err);
    return reply.status(500).send({error: 'Erro ao buscar categoria'});
  }
}

export async function updateCategoryHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();

    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({error: parsed.error.flatten()});
    }

    const {categoryId} = req.params as {categoryId: string};
    const payload = req.user as AuthTokenPayload;

    const category = await updateCategory(categoryId, payload.userId, parsed.data);

    return reply.send(category);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    if (err.message === 'CATEGORY_NOT_FOUND') {
      return reply.status(404).send({error: 'Categoria não encontrada'});
    }
    console.error('Erro ao atualizar categoria:', err);
    return reply.status(500).send({error: 'Erro ao atualizar categoria'});
  }
}

export async function deleteCategoryHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();

    const {categoryId} = req.params as {categoryId: string};
    const payload = req.user as AuthTokenPayload;

    await deleteCategory(categoryId, payload.userId);

    return reply.send({success: true});
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    if (err.message === 'CATEGORY_NOT_FOUND') {
      return reply.status(404).send({error: 'Categoria não encontrada'});
    }
    console.error('Erro ao deletar categoria:', err);
    return reply.status(500).send({error: 'Erro ao deletar categoria'});
  }
}
