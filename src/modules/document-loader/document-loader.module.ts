import { DocumentLoaderService } from './document-loader.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
    imports: [],
    controllers: [],
    providers: [
        DocumentLoaderService, ],
})
export class DocumentLoaderModule {}
