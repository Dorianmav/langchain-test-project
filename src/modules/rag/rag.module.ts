import { RagController } from './rag.controller';
import { RagService } from './rag.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
    imports: [],
    controllers: [
        RagController,],
    providers: [
        RagService,],
})
export class RagModule { }
