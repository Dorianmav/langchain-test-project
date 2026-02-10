import { LlmService } from './llm.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
    imports: [],
    controllers: [],
    providers: [
        LlmService,],
})
export class LlmModule { }
