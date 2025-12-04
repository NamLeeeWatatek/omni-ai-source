import { Global, Module } from '@nestjs/common';

/**
 * Global shared module for events and interfaces
 * This module is imported once in AppModule and available everywhere
 * No circular dependencies as it only contains interfaces and events
 */
@Global()
@Module({
    providers: [],
    exports: [],
})
export class SharedModule { }
