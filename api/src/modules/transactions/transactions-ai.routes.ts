import type {FastifyInstance} from 'fastify';
import {getCategoriesByUserId} from '@modules/categories/categories.service';
import type {AuthTokenPayload} from '../auth/auth.types';

export async function transactionsAiRoutes(fastify: FastifyInstance) {
  fastify.post<{Body: {description: string}}>('/transactions/suggest-category', async (request, reply) => {
    try {
      await request.jwtVerify();
      const payload = request.user as AuthTokenPayload;

      const {description} = request.body;

      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return reply.code(400).send({
          error: 'Description is required',
        });
      }

      // Get user's categories
      const categories = await getCategoriesByUserId(payload.userId);

      if (categories.length === 0) {
        return {
          success: true,
          suggestions: [],
          message: 'No categories available',
        };
      }

      // Simple keyword matching for category suggestion
      const descLower = description.toLowerCase();
      
      // Expanded keyword mapping with more specific patterns
      const keywords: Record<string, string[]> = {
        'Alimentação': ['restaurante', 'comida', 'café', 'pizza', 'hambúrguer', 'almoço', 'janta', 'açougue', 'padaria', 'supermercado', 'mercearia', 'lanche', 'bebida', 'bar', 'sorveteria', 'pastelaria', 'churrascaria', 'pão', 'bolo', 'doce', 'snack', 'fast food', 'delivery', 'carrefour', 'pão de queijo', 'marmita', 'refeição', 'lanches'],
        'Transporte': ['uber', 'taxi', 'ônibus', 'carro', 'combustível', 'gasolina', 'diesel', 'metrô', 'passagem', 'viagem', 'transfer', 'buscar', 'motorista', 'estacionamento', 'táxi', 'viajem', 'carona', 'rideshare'],
        'Eletrônicos': ['tecnologia', 'computador', 'celular', 'phone', 'iphone', 'tablet', 'headphone', 'eletrônico', 'samsung', 'notebook', 'teclado', 'mouse', 'monitor', 'webcam', 'fone', 'eletrônicos'],
        'Saúde': ['farmácia', 'médico', 'remédio', 'hospital', 'dentista', 'academia', 'consulta', 'medicamento', 'fisioterapia', 'análise', 'clínica', 'exame', 'vitamina', 'farmácia'],
        'Educação': ['escola', 'curso', 'livro', 'educação', 'aula', 'faculdade', 'professor', 'matrícula', 'material escolar', 'universidade', 'apostila', 'aulas particulares'],
        'Diversão': ['cinema', 'jogo', 'streaming', 'netflix', 'spotify', 'lazer', 'diversão', 'show', 'festa', 'bar', 'karaokê', 'parque', 'museu', 'jogos', 'entretenimento'],
        'Moradia': ['aluguel', 'água', 'energia', 'luz', 'gás', 'condomínio', 'imóvel', 'casa', 'apartamento', 'reforma', 'manutenção', 'pintura', 'piso', 'azulejo'],
      };

      // Score each category based on keyword matches
      const scored = categories.map(cat => {
        let score = 0;
        
        // Try to match by hardcoded keywords first
        Object.entries(keywords).forEach(([keywordCat, keywordsList]) => {
          // Match with this category if it has a similar name
          const catNameLower = cat.name.toLowerCase();
          const isMatchingCategory = 
            keywordCat.toLowerCase() === catNameLower ||
            keywordCat.toLowerCase().includes(catNameLower) ||
            catNameLower.includes(keywordCat.toLowerCase().split(' ')[0]);

          if (isMatchingCategory) {
            keywordsList.forEach(keyword => {
              if (descLower.includes(keyword)) {
                score += 2; // Higher weight for direct keyword matches
              }
            });
          }
        });

        // Fallback: fuzzy match on category name itself
        if (score === 0) {
          const catNameLower = cat.name.toLowerCase();
          // Check if description contains part of category name
          const nameParts = catNameLower.split(/\s+/);
          nameParts.forEach(part => {
            if (part.length > 2 && descLower.includes(part)) {
              score += 1;
            }
          });
        }

        return {
          name: cat.name,
          color: cat.color,
          score,
        };
      });

      // Sort by score and return top 3
      const suggestions = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      // If no matches found, return all categories sorted by name for user to pick
      const finalSuggestions = suggestions.length > 0 
        ? suggestions 
        : categories.map(cat => ({name: cat.name, color: cat.color, score: 0}));

      return {
        success: true,
        suggestions: finalSuggestions,
        topSuggestion: suggestions[0] || null,
      };
    } catch (error: any) {
      if (error.message?.includes('jwt')) {
        return reply.status(401).send({error: 'Unauthorized'});
      }
      console.error('[TransactionsAI] Error:', error);
      return reply.status(500).send({error: 'Failed to suggest category'});
    }
  });
}
