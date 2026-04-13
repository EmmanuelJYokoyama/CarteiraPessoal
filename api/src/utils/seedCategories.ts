import {db} from '@db/index';
import {categories} from '@db/schema/categories';
import {users} from '@db/schema/users';
import {eq} from 'drizzle-orm';

const DEFAULT_CATEGORIES = [
  {name: 'Alimentação', color: '#FF6B6B'},
  {name: 'Transporte', color: '#4ECDC4'},
  {name: 'Moradia', color: '#98D8C8'},
  {name: 'Saúde', color: '#45B7D1'},
  {name: 'Educação', color: '#FFD93D'},
  {name: 'Diversão', color: '#FFA07A'},
  {name: 'Outro', color: '#B8A6F0'},
];

export async function seedUserCategories(userId: string) {
  try {
    // Verificar se o usuário já possui categorias
    const existingCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));

    // Se não houver categorias, criar as padrões
    if (existingCategories.length === 0) {
      const defaultCategoryValues = DEFAULT_CATEGORIES.map(cat => ({
        userId,
        name: cat.name,
        color: cat.color,
      }));

      await db.insert(categories).values(defaultCategoryValues);
      console.log(`✅ Categorias padrão criadas para usuário ${userId}`);
    }
  } catch (error) {
    console.error('Erro ao criar categorias padrão:', error);
    // Não falhar a autenticação por causa disso
  }
}
