import { SearchService } from './search.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
    imports: [],
    controllers: [],
    providers: [
        SearchService,],
})
export class SearchModule { }
