import { EmbeddingsService } from './embeddings.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
    imports: [],
    controllers: [],
    providers: [
        EmbeddingsService,],
})
export class EmbeddingsModule { }
