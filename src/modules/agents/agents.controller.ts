import { Controller, Post, Get, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CustomToolService } from './services/custom-tool.service';
import {
  AgentRequestDto,
  AgentResponseDto,
  CustomToolDto,
  CustomToolResponseDto,
  ToolListDto,
  DeleteToolResponseDto,
} from './dto';

/**
 * Contrôleur pour les Agents LangChain
 * Endpoints: Execute Agent, Register Custom Tool, List Tools
 */
@ApiTags('Agents')
@Controller('agents')
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly customToolService: CustomToolService,
  ) {}

  /**
   * Execute Agent - Pattern ReAct (Reasoning + Acting)
   */
  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute Agent with ReAct Pattern',
    description: 'Exécute un agent intelligent avec le pattern ReAct. L\'agent peut utiliser des tools (web_search, calculator, datetime) pour accomplir des tâches complexes.',
  })
  @ApiBody({
    type: AgentRequestDto,
    examples: {
      webSearch: {
        summary: 'Recherche web',
        value: {
          task: 'Trouve les dernières nouvelles sur NestJS et résume-les',
          tools: ['web_search'],
          maxIterations: 5,
          timeout: 30,
          verbose: true,
        },
      },
      calculation: {
        summary: 'Calcul mathématique',
        value: {
          task: 'Calcule (25 * 4) + (100 / 5) et explique le résultat',
          tools: ['calculator'],
          maxIterations: 3,
          verbose: true,
        },
      },
      multiTool: {
        summary: 'Multi-tools avec mémoire',
        value: {
          sessionId: 'user-456',
          task: 'Quelle est la date d\'aujourd\'hui et recherche des événements importants pour cette date',
          tools: ['datetime', 'web_search'],
          maxIterations: 5,
          temperature: 0.7,
          verbose: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Agent exécuté avec succès',
    type: AgentResponseDto,
  })
  async execute(@Body() dto: AgentRequestDto): Promise<AgentResponseDto> {
    return this.agentsService.execute(dto);
  }

  /**
   * Register Custom Tool - Enregistre un outil HTTP personnalisé
   */
  @Post('tools/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register Custom HTTP Tool',
    description: 'Enregistre un outil personnalisé basé sur HTTP. L\'outil peut être appelé par les agents.',
  })
  @ApiBody({
    type: CustomToolDto,
    examples: {
      weatherAPI: {
        summary: 'API Météo',
        value: {
          name: 'weather_api',
          description: 'Récupère la météo actuelle pour une ville. Input: nom de la ville',
          endpoint: 'https://api.openweathermap.org/data/2.5/weather',
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          responseTemplate: 'Météo à {name}: {weather[0].description}, Température: {main.temp}°C',
        },
      },
      jokes: {
        summary: 'API Blagues',
        value: {
          name: 'joke_api',
          description: 'Récupère une blague aléatoire',
          endpoint: 'https://official-joke-api.appspot.com/random_joke',
          method: 'GET',
          responseTemplate: '{setup} - {punchline}',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Outil personnalisé enregistré',
    type: CustomToolResponseDto,
  })
  async registerTool(@Body() dto: CustomToolDto): Promise<CustomToolResponseDto> {
    this.customToolService.registerTool(dto);
    return {
      name: dto.name,
      status: 'registered',
      message: `Custom tool '${dto.name}' registered successfully`,
    };
  }

  /**
   * List All Tools - Liste tous les outils disponibles
   */
  @Get('tools')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List All Available Tools',
    description: 'Liste tous les outils disponibles (système + custom).',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des outils',
    type: ToolListDto,
  })
  listTools(): ToolListDto {
    return this.agentsService.listAllTools();
  }

  /**
   * Delete Custom Tool - Supprime un outil personnalisé
   */
  @Delete('tools/:name')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Custom Tool',
    description: 'Supprime un outil personnalisé par son nom.',
  })
  @ApiResponse({
    status: 200,
    description: 'Outil supprimé',
    type: DeleteToolResponseDto,
  })
  deleteTool(@Param('name') name: string): { message: string; name: string } {
    this.customToolService.deleteTool(name);
    return {
      message: 'Custom tool deleted successfully',
      name,
    };
  }
}
