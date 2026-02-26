import { ApiProperty } from '@nestjs/swagger';

export class DeleteToolResponseDto {
  @ApiProperty({ description: 'Message de confirmation', example: 'Custom tool deleted successfully' })
  message: string;

  @ApiProperty({ description: 'Nom de l\'outil supprimé', example: 'weather_api' })
  name: string;
}
