import type {FastifyInstance} from 'fastify';

export async function locationRoutes(fastify: FastifyInstance) {
  fastify.get<{Querystring: {latitude: string; longitude: string}}>(
    '/location/address',
    async (request, reply) => {
      try {
        const {latitude, longitude} = request.query;

        if (!latitude || !longitude) {
          return reply.code(400).send({
            error: 'latitude e longitude são obrigatórios',
          });
        }

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lon)) {
          return reply.code(400).send({
            error: 'latitude e longitude devem ser números válidos',
          });
        }

        // Chama API Nominatim do backend (sem problemas de CORS)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
          {
            headers: {
              'User-Agent': 'CarteiraPessoal/1.0 (location-service)',
            },
          }
        );

        if (!response.ok) {
          return reply.code(500).send({
            error: 'Erro ao obter endereço do OpenStreetMap',
          });
        }

        const data = await response.json();

        // Extrai informações úteis
        const address = data.address || {};
        const name =
          address.street ||
          address.road ||
          address.neighbourhood ||
          address.suburb ||
          address.city ||
          data.display_name?.split(',')[0] ||
          'Local desconhecido';

        const fullAddress = data.display_name || name;

        const result = {
          success: true,
          name,
          fullAddress,
          address,
          rawData: data,
        };
        
        console.log('[Location] Resultado:', JSON.stringify(result, null, 2));
        return result;
      } catch (error) {
        console.error('[Location] Erro ao obter endereço:', error);
        return reply.code(500).send({
          error: 'Erro ao processar localização',
        });
      }
    }
  );
}
