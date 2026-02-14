import { Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { RagIngestionService, RagRetrievalService, RagGenerationService } from './services';
import { DocumentLoaderModule } from '../document-loader/document-loader.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { LLMModule } from '../llm/llm.module';
import { PromptsModule } from '../prompts/prompts.module';

/**
 * Module RAG - Retrieval-Augmented Generation
 * 
 * Intègre tous les composants nécessaires au pipeline RAG :
 * - DocumentLoader : Chargement et chunking de documents
 * - VectorStore : Stockage et recherche de similarité
 * - LLM : Génération de réponses contextualisées
 * - Prompts : Gestion des templates de prompts et few-shot learning
 * 
 * Services spécialisés :
 * - RagIngestionService : Ingestion de documents
 * - RagRetrievalService : Récupération de documents pertinents
 * - RagGenerationService : Génération de réponses
 */
@Module({
  imports: [
    DocumentLoaderModule,  // Pour charger et découper les documents
    VectorStoreModule,     // Pour stocker et rechercher des vecteurs
    LLMModule,             // Pour générer les réponses
    PromptsModule,         // Pour gérer les prompts et templates
  ],
  controllers: [RagController],
  providers: [
    RagService,
    RagIngestionService,
    RagRetrievalService,
    RagGenerationService,
  ],
  exports: [RagService],   // Exporter pour utilisation externe si nécessaire
})
export class RagModule {}
