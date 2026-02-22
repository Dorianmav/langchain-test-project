/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Post, Get, Delete, Put, Body, Query, HttpException, HttpStatus, Param, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VectorStoreService } from './vector-store.service';
import { RedisService } from '../../common/cache/redis.service';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { 
  AddDocumentsDto, 
  SearchDto, DeleteDocumentsDto,
  UpdateDocumentDto,
  AddDocumentsResponseDto,
  SearchResponseDto,
  UpdateDocumentResponseDto,
} from './dto';

@ApiTags('Vector Store')
@Controller('vector-store')
@UseInterceptors(AuditInterceptor)
export class VectorStoreController {
  private readonly namespace = 'vector-store';

  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly redisService: RedisService,
  ) {}

  @Post('documents')
  @ApiOperation({ summary: 'Ajouter des documents au vector store' })
  @ApiResponse({ 
    status: 201, 
    description: 'Documents ajoutés avec succès', 
    type: AddDocumentsResponseDto 
  })
  async addDocuments(@Body() dto: AddDocumentsDto): Promise<AddDocumentsResponseDto> {
    try {
      const { ids, count } = await this.vectorStoreService.addDocuments(dto.documents);
      const info = this.vectorStoreService.getVectorStoreInfo();

      return {
        ids,
        count,
        message: `Successfully added ${count} document(s)`,
        metadata: {
          provider: info.provider,
          collection: info.collection,
          embeddingsModel: info.embeddings.model,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to add documents: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('search')
  @ApiOperation({ summary: 'Rechercher des documents par similarité sémantique' })
  @ApiResponse({ 
    status: 200, 
    description: 'Résultats de recherche', 
    type: SearchResponseDto 
  })
  async search(@Body() dto: SearchDto): Promise<SearchResponseDto> {
    try {
      const cacheKey = this.generateCacheKey(dto);
      const cached = await this.redisService.get<SearchResponseDto>(this.namespace, cacheKey);

      if (cached) {
        return cached;
      }

      const { documents, metadata } = await this.vectorStoreService.similaritySearch(
        dto.query,
        dto.k,
        dto.filter,
        dto.includeScores,
      );

      const response: SearchResponseDto = {
        documents: documents.map(doc => ({
          id: doc.metadata.id,
          content: doc.content,
          metadata: doc.metadata,
          score: doc.score,
        })),
        query: dto.query,
        resultsCount: documents.length,
        metadata,
      };

      // Cache Redis 5 minutes (300 secondes)
      await this.redisService.set(this.namespace, cacheKey, response, 300);

      return response;
    } catch (error) {
      throw new HttpException(
        `Search failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('documents')
  @ApiOperation({ summary: 'Supprimer des documents par IDs' })
  @ApiResponse({ status: 200, description: 'Documents supprimés' })
  async deleteDocuments(@Body() dto: DeleteDocumentsDto) {
    try {
      return await this.vectorStoreService.deleteDocuments(dto.ids);
    } catch (error) {
      throw new HttpException(
        `Failed to delete documents: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('count')
  @ApiOperation({ summary: 'Obtenir le nombre de documents dans le vector store' })
  @ApiResponse({ status: 200, description: 'Nombre de documents' })
  async getCount() {
    try {
      return await this.vectorStoreService.getDocumentCount();
    } catch (error) {
      throw new HttpException(
        `Failed to get document count: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('documents/list')
  @ApiOperation({ summary: 'Récupérer tous les documents avec leurs IDs' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre maximum de documents (défaut: 100)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset pour pagination (défaut: 0)' })
  @ApiResponse({ status: 200, description: 'Liste des documents avec IDs' })
  async getAllDocuments(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    try {
      return await this.vectorStoreService.getAllDocuments(
        limit ? parseInt(limit.toString()) : 100,
        offset ? parseInt(offset.toString()) : 0,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to get documents: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('info')
  @ApiOperation({ summary: 'Obtenir les informations du vector store' })
  @ApiResponse({ status: 200, description: 'Informations du vector store' })
  getInfo() {
    return this.vectorStoreService.getVectorStoreInfo();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check du vector store et embeddings' })
  @ApiResponse({ status: 200, description: 'Statut de santé' })
  async healthCheck() {
    return await this.vectorStoreService.healthCheck();
  }

  @Put('documents/:id')
  @ApiOperation({ summary: 'Mettre à jour un document existant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Document mis à jour avec succès',
    type: UpdateDocumentResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  async updateDocument(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto
  ): Promise<UpdateDocumentResponseDto> {
    try {
      const result = await this.vectorStoreService.updateDocument(id, dto.content, dto.metadata);
      
      if (!result.success) {
        throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
      }
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update document: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Récupérer un document par son ID' })
  @ApiResponse({ status: 200, description: 'Document trouvé' })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  async getDocumentById(@Param('id') id: string) {
    const document = await this.vectorStoreService.getDocumentById(id);
    
    if (!document) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }
    
    return document;
  }

  /**
   * Génère une clé de cache unique basée sur les paramètres de recherche
   */
  private generateCacheKey(dto: SearchDto): string {
    const parts = [
      dto.query,
      dto.k,
      dto.includeScores,
      dto.filter ? JSON.stringify(dto.filter) : '',
    ].filter(v => v !== undefined && v !== '');

    return parts.join(':');
  }
}