import { PartialType } from '@nestjs/mapped-types';
import { CreateTemplateDto } from './create-template.dto';

/**
 * DTO pour mettre à jour un template personnalisé
 * Tous les champs sont optionnels
 */
export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {}
