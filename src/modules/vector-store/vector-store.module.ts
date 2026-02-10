import { VectorStoreService } from './vector-store.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
    imports: [],
    controllers: [],
    providers: [
        VectorStoreService,],
})
export class VectorStoreModule { }
