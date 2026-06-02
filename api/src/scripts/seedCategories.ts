import {db} from '@db/index';
import {categories} from '@db/schema/categories';
import {eq} from 'drizzle-orm';
import {DEFAULT_CATEGORIES} from '@modules/categories/categories.constants';

export async function seedDefaultCategoriesForUser(userId: string) {
  await db.delete(categories).where(eq(categories.userId, userId));

  const inserted = await db.insert(categories).values(
    DEFAULT_CATEGORIES.map(category => ({
      userId,
      name: category.name,
      color: category.color,
    })),
  ).returning();

  return inserted;
}

async function main() {
  const demoUserId = process.env.SEED_USER_ID || '08887af1-fe56-4b08-8751-38c8a02be120';

  const inserted = await seedDefaultCategoriesForUser(demoUserId);
  console.log(`Seed de categorias concluído com sucesso para ${demoUserId}: ${inserted.length} registros`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Erro ao executar seed de categorias:', error);
    process.exit(1);
  });
}
