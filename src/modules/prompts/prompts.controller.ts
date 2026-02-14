import { Controller, Post, Get, Delete, Patch, Body, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PromptService } from './prompts.service';
import {
  PromptType,
  FewShotCategory,
  CreatePromptDto,
  FormatPromptDto,
  ValidatePromptDto,
  PromptValidationResponse,
  CreatePromptResponse,
  CreateFewShotExampleDto,
  CreateFewShotExampleResponse,
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateResponse,
  TemplateListResponse,
} from './dto';

/**
 * Contrôleur pour la gestion des prompts
 * 
 * Fournit des endpoints pour créer, formater et valider des prompts
 */
@ApiTags('Prompts')
@Controller('prompts')
export class PromptsController {
  private readonly logger = new Logger(PromptsController.name);

  constructor(private readonly promptService: PromptService) {}

  /**
   * Crée un prompt selon le type et les options
   */
  @Post('create')
  @ApiOperation({
    summary: 'Créer un prompt',
    description: 'Crée un prompt selon le type (RAG, conversation, etc.) avec options de few-shot learning',
  })
  @ApiResponse({
    status: 201,
    description: 'Prompt créé avec succès',
    type: CreatePromptResponse,
  })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  async createPrompt(@Body() dto: CreatePromptDto): Promise<CreatePromptResponse> {
    this.logger.log(`POST /prompts/create - type: ${dto.type}`);
    return this.promptService.createPrompt(dto);
  }

  /**
   * Formate un prompt avec des variables
   */
  @Post('format')
  @ApiOperation({
    summary: 'Formater un prompt',
    description: 'Formate un template de prompt avec les variables fournies',
  })
  @ApiResponse({
    status: 200,
    description: 'Prompt formaté avec succès',
    schema: { type: 'string' },
  })
  @ApiResponse({ status: 400, description: 'Erreur de formatage' })
  async formatPrompt(@Body() dto: FormatPromptDto): Promise<{ formatted: string }> {
    this.logger.log('POST /prompts/format');
    const formatted = await this.promptService.formatPrompt(dto);
    return { formatted };
  }

  /**
   * Valide un template de prompt
   */
  @Post('validate')
  @ApiOperation({
    summary: 'Valider un prompt',
    description: 'Vérifie qu\'un template de prompt contient toutes les variables requises',
  })
  @ApiResponse({
    status: 200,
    description: 'Résultat de validation',
    type: PromptValidationResponse,
  })
  async validatePrompt(@Body() dto: ValidatePromptDto): Promise<PromptValidationResponse> {
    this.logger.log('POST /prompts/validate');
    return this.promptService.validatePromptTemplate(dto);
  }

  /**
   * Récupère les exemples few-shot par catégorie
   */
  @Get('examples/:category')
  @ApiOperation({
    summary: 'Récupérer les exemples few-shot',
    description: 'Récupère les exemples few-shot pour une catégorie donnée',
  })
  @ApiParam({
    name: 'category',
    enum: FewShotCategory,
    description: 'Catégorie d\'exemples',
  })
  @ApiResponse({
    status: 200,
    description: 'Exemples récupérés avec succès',
  })
  getFewShotExamples(@Param('category') category: FewShotCategory) {
    this.logger.log(`GET /prompts/examples/${category}`);
    return {
      category,
      examples: this.promptService.getFewShotExamples(category),
    };
  }

  /**
   * Récupère tous les exemples few-shot
   */
  @Get('examples')
  @ApiOperation({
    summary: 'Récupérer tous les exemples',
    description: 'Récupère tous les exemples few-shot disponibles',
  })
  @ApiResponse({
    status: 200,
    description: 'Tous les exemples récupérés',
  })
  getAllExamples() {
    this.logger.log('GET /prompts/examples');
    return this.promptService.getAllFewShotExamples();
  }

  /**
   * Récupère tous les templates disponibles
   */
  @Get('templates')
  @ApiOperation({
    summary: 'Lister tous les templates',
    description: 'Récupère la liste de tous les templates système disponibles avec leurs descriptions et variables',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des templates récupérée',
  })
  getAllTemplates() {
    this.logger.log('GET /prompts/templates');
    return this.promptService.getAllTemplates();
  }

  /**
   * Récupère tous les templates (système + personnalisés)
   */
  @Get('templates/all')
  @ApiOperation({
    summary: 'Lister tous les templates (système + custom)',
    description: 'Récupère la liste complète des templates système et personnalisés',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste complète récupérée',
    type: TemplateListResponse,
  })
  getAllTemplatesWithCustom(): TemplateListResponse {
    this.logger.log('GET /prompts/templates/all');
    return this.promptService.getAllTemplatesWithCustom();
  }

  /**
   * Crée un nouveau template personnalisé
   */
  @Post('templates/custom')
  @ApiOperation({
    summary: 'Créer un template personnalisé',
    description: 'Crée un nouveau template personnalisé pour des cas d\'usage spécifiques (ex: search, scraping)',
  })
  @ApiResponse({
    status: 201,
    description: 'Template créé avec succès',
    type: TemplateResponse,
  })
  @ApiResponse({ status: 400, description: 'Données invalides ou template déjà existant' })
  @ApiResponse({ status: 403, description: 'Nom réservé pour template système' })
  createCustomTemplate(@Body() dto: CreateTemplateDto): TemplateResponse {
    this.logger.log(`POST /prompts/templates/custom - name: ${dto.name}`);
    return this.promptService.createCustomTemplate(dto);
  }

  /**
   * Récupère un template par nom
   */
  @Get('templates/:name')
  @ApiOperation({
    summary: 'Récupérer un template par nom',
    description: 'Récupère un template spécifique (système ou personnalisé) par son nom',
  })
  @ApiParam({
    name: 'name',
    description: 'Nom du template (ex: rag, search, scraper)',
    example: 'search',
  })
  @ApiResponse({
    status: 200,
    description: 'Template récupéré avec succès',
    type: TemplateResponse,
  })
  @ApiResponse({ status: 404, description: 'Template introuvable' })
  getTemplateByName(@Param('name') name: string): TemplateResponse {
    this.logger.log(`GET /prompts/templates/${name}`);
    return this.promptService.getTemplateByName(name);
  }

  /**
   * Met à jour un template personnalisé
   */
  @Patch('templates/custom/:name')
  @ApiOperation({
    summary: 'Mettre à jour un template personnalisé',
    description: 'Modifie un template personnalisé existant. Les templates système ne peuvent pas être modifiés.',
  })
  @ApiParam({
    name: 'name',
    description: 'Nom du template personnalisé à modifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Template modifié avec succès',
    type: TemplateResponse,
  })
  @ApiResponse({ status: 403, description: 'Template système non modifiable' })
  @ApiResponse({ status: 404, description: 'Template introuvable' })
  updateCustomTemplate(
    @Param('name') name: string,
    @Body() dto: UpdateTemplateDto,
  ): TemplateResponse {
    this.logger.log(`PATCH /prompts/templates/custom/${name}`);
    return this.promptService.updateCustomTemplate(name, dto);
  }

  /**
   * Supprime un template personnalisé
   */
  @Delete('templates/custom/:name')
  @ApiOperation({
    summary: 'Supprimer un template personnalisé',
    description: 'Supprime un template personnalisé. Les templates système ne peuvent pas être supprimés.',
  })
  @ApiParam({
    name: 'name',
    description: 'Nom du template personnalisé à supprimer',
  })
  @ApiResponse({
    status: 200,
    description: 'Template supprimé avec succès',
  })
  @ApiResponse({ status: 403, description: 'Template système non supprimable' })
  @ApiResponse({ status: 404, description: 'Template introuvable' })
  deleteCustomTemplate(@Param('name') name: string) {
    this.logger.log(`DELETE /prompts/templates/custom/${name}`);
    return this.promptService.deleteCustomTemplate(name);
  }

  /**
   * Récupère un template par défaut (ancien endpoint, conservé pour compatibilité)
   */
  @Get('templates/system/:type')
  @ApiOperation({
    summary: 'Récupérer un template système par type',
    description: 'Récupère le template système par défaut pour un type de prompt',
  })
  @ApiParam({
    name: 'type',
    enum: PromptType,
    description: 'Type de prompt',
  })
  @ApiResponse({
    status: 200,
    description: 'Template récupéré avec succès',
  })
  getDefaultTemplate(@Param('type') type: PromptType) {
    this.logger.log(`GET /prompts/templates/${type}`);
    return {
      type,
      template: this.promptService.getDefaultTemplate(type),
    };
  }

  /**
   * Récupère les statistiques du cache
   */
  @Get('cache/stats')
  @ApiOperation({
    summary: 'Statistiques du cache',
    description: 'Récupère les statistiques du cache des prompts',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques du cache',
  })
  getCacheStats() {
    this.logger.log('GET /prompts/cache/stats');
    return this.promptService.getCacheStats();
  }

  /**
   * Vide le cache des prompts
   */
  @Post('cache/clear')
  @ApiOperation({
    summary: 'Vider le cache',
    description: 'Vide le cache des prompts',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache vidé avec succès',
  })
  clearCache() {
    this.logger.log('POST /prompts/cache/clear');
    this.promptService.clearCache();
    return { message: 'Cache vidé avec succès' };
  }

  /**
   * Extrait les variables d'un template
   */
  @Post('extract-variables')
  @ApiOperation({
    summary: 'Extraire les variables',
    description: 'Extrait les variables d\'un template de prompt',
  })
  @ApiResponse({
    status: 200,
    description: 'Variables extraites avec succès',
  })
  extractVariables(@Body() body: { template: string }) {
    this.logger.log('POST /prompts/extract-variables');
    return {
      template: body.template,
      variables: this.promptService.extractVariables(body.template),
    };
  }

  /**
   * Crée un nouvel exemple few-shot
   */
  @Post('examples/create')
  @ApiOperation({
    summary: 'Créer un exemple few-shot',
    description: 'Crée un nouvel exemple few-shot pour une catégorie donnée',
  })
  @ApiResponse({
    status: 201,
    description: 'Exemple créé avec succès',
    type: CreateFewShotExampleResponse,
  })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  createFewShotExample(@Body() dto: CreateFewShotExampleDto): CreateFewShotExampleResponse {
    this.logger.log(`POST /prompts/examples/create - category: ${dto.category}`);
    return this.promptService.createFewShotExample(dto);
  }

  /**
   * Récupère les exemples personnalisés d'une catégorie
   */
  @Get('examples/custom/:category')
  @ApiOperation({
    summary: 'Récupérer exemples personnalisés',
    description: 'Liste tous les exemples few-shot personnalisés d\'une catégorie',
  })
  @ApiResponse({ status: 200, description: 'Liste des exemples' })
  getCustomExamples(@Param('category') category: FewShotCategory) {
    this.logger.log(`GET /prompts/examples/custom/${category}`);
    return {
      category,
      examples: this.promptService.getCustomFewShotExamples(category),
      count: this.promptService.getCustomFewShotExamples(category).length,
    };
  }

  /**
   * Supprime les exemples personnalisés d'une catégorie
   */
  @Delete('examples/custom/:category')
  @ApiOperation({
    summary: 'Supprimer exemples d\'une catégorie',
    description: 'Supprime les exemples personnalisés d\'une catégorie spécifique',
  })
  @ApiResponse({ status: 200, description: 'Exemples supprimés' })
  clearCustomExamplesByCategory(@Param('category') category: FewShotCategory) {
    this.logger.log(`DELETE /prompts/examples/custom/${category}`);
    const count = this.promptService.clearCustomExamples(category);
    return {
      message: `${count} exemples supprimés de ${category}`,
      count,
    };
  }

  /**
   * Supprime TOUS les exemples personnalisés
   */
  @Delete('examples/custom')
  @ApiOperation({
    summary: 'Supprimer tous les exemples',
    description: 'Supprime tous les exemples personnalisés de toutes les catégories',
  })
  @ApiResponse({ status: 200, description: 'Tous les exemples supprimés' })
  clearAllCustomExamples() {
    this.logger.log('DELETE /prompts/examples/custom (all)');
    const count = this.promptService.clearCustomExamples();
    return {
      message: `Tous les ${count} exemples supprimés`,
      count,
    };
  }
}
