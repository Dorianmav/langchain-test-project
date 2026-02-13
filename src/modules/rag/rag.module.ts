import { Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { DocumentLoaderModule } from '../document-loader/document-loader.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { LLMModule } from '../llm/llm.module';

/**
 * Module RAG - Retrieval-Augmented Generation
 * 
 * Intègre tous les composants nécessaires au pipeline RAG :
 * - DocumentLoader : Chargement et chunking de documents
 * - Embeddings : Génération de vecteurs sémantiques
 * - VectorStore : Stockage et recherche de similarité
 * - LLM : Génération de réponses contextualisées
 */
@Module({
  imports: [
    DocumentLoaderModule,  // Pour charger et découper les documents
    EmbeddingsModule,      // Pour générer les embeddings
    VectorStoreModule,     // Pour stocker et rechercher des vecteurs
    LLMModule,             // Pour générer les réponses
  ],
  controllers: [RagController],
  providers: [RagService],
  exports: [RagService],   // Exporter pour utilisation externe si nécessaire
})
export class RagModule {}
