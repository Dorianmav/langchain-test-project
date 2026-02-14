import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DocumentLoaderService } from './document-loader.service';
import { ProcessDocumentDto, UploadedDocumentResponseDto } from './dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Controller pour l'upload et le traitement de documents
 */
@ApiTags('Document Loader')
@Controller('documents')
export class DocumentLoaderController {
  private readonly logger = new Logger(DocumentLoaderController.name);

  constructor(private readonly documentLoaderService: DocumentLoaderService) {}

  /**
   * Upload un fichier (PDF, TXT, MD, JSON, CSV)
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedTypes = ['pdf', 'txt', 'md', 'json', 'csv'];
        const fileExt = extname(file.originalname).slice(1).toLowerCase();
        
        if (allowedTypes.includes(fileExt)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `File type not supported. Allowed: ${allowedTypes.join(', ')}`
            ),
            false
          );
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB max
      },
    })
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document (PDF, TXT, MD, JSON, CSV)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        metadata: {
          type: 'object',
          example: { category: 'documentation', author: 'John Doe' },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      properties: {
        filePath: { type: 'string', example: '/uploads/abc123.pdf' },
        fileName: { type: 'string', example: 'document.pdf' },
        fileSize: { type: 'number', example: 1024000 },
        fileType: { type: 'string', example: 'pdf' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('metadata') metadata?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`📤 File uploaded: ${file.originalname} (${file.size} bytes)`);

    const parsedMetadata = metadata ? JSON.parse(metadata) : {};

    return {
      filePath: file.path,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: extname(file.originalname).slice(1).toLowerCase(),
      metadata: parsedMetadata,
    };
  }

  /**
   * Traite un document : charge + découpe en chunks
   */
  @Post('process')
  @ApiOperation({ summary: 'Load and split a document into chunks' })
  @ApiBody({ type: ProcessDocumentDto })
  @ApiResponse({
    status: 200,
    description: 'Document processed successfully',
    type: UploadedDocumentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file path or configuration' })
  async processDocument(@Body() dto: ProcessDocumentDto): Promise<UploadedDocumentResponseDto> {
    this.logger.log(`⚙️  Processing document: ${dto.filePath}`);

    // Charger et découper le document
    const chunks = await this.documentLoaderService.loadAndSplit(
      dto.filePath,
      {
        chunkSize: dto.chunkSize,
        chunkOverlap: dto.chunkOverlap,
      },
      dto.metadata
    );

    // Générer les IDs des chunks
    const chunkIds = chunks.map((_, index) => `chunk_${uuidv4()}_${index}`);

    const response: UploadedDocumentResponseDto = {
      id: `doc_${uuidv4()}`,
      fileName: chunks[0]?.metadata?.source || dto.filePath,
      fileType: this.documentLoaderService['getFileExtension'](dto.filePath),
      fileSize: chunks.reduce((sum, chunk) => sum + chunk.pageContent.length, 0),
      chunksCount: chunks.length,
      chunkIds,
      metadata: dto.metadata || {},
      uploadedAt: new Date(),
    };

    this.logger.log(`✅ Document processed: ${chunks.length} chunks created`);

    return response;
  }

  /**
   * Liste les types de fichiers supportés
   */
  @Get('supported-types')
  @ApiOperation({ summary: 'Get supported file types' })
  @ApiResponse({
    status: 200,
    description: 'List of supported file types',
    schema: {
      type: 'object',
      properties: {
        supportedTypes: {
          type: 'array',
          items: { type: 'string' },
          example: ['pdf', 'txt', 'md', 'json', 'csv'],
        },
      },
    },
  })
  getSupportedTypes() {
    return {
      supportedTypes: this.documentLoaderService.getSupportedTypes(),
    };
  }
}
