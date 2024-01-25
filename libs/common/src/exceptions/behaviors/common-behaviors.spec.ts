import { CaughtExceptionHttpContext, CommonExceptionHandlerBehaviorHttp } from '@jchpro/nest-common';

describe('CommonExceptionHandlerBehaviorHttp', () => {
  let behavior: CommonExceptionHandlerBehaviorHttp;

   function create(prod: boolean) {
     behavior = new CommonExceptionHandlerBehaviorHttp(prod);
   }

   function unrecognizedExceptionContext(): CaughtExceptionHttpContext {
     return {
       host: {} as any,
       exception: new Error(),
       recognized: false,
       data: {
         error: 'error',
         message: 'message',
         uuid: 'uuid',
         timestamp: 'ts',
         stack: 'stack',
         statusCode: 500
       }
     };
   }

   it('should attach uuid to the response object and log it, and log stack in production mode for unrecognized exception', () => {
     // Given
     create(true);

     // When
     const instructions = behavior.instruct(unrecognizedExceptionContext());

     // Then
     expect(instructions).toEqual({
       log: ['[uuid] error: message', 'stack'],
       respondWith: {
         error: 'error',
         message: 'message',
         uuid: 'uuid',
         timestamp: 'ts',
         statusCode: 500
       }
     });
   });

   it('should not attach uuid to the response object and log it, and not log stack in development mode for unrecognized exception', () => {
     // Given
     create(false);

     // When
     const instructions = behavior.instruct(unrecognizedExceptionContext());

     // Then
     expect(instructions).toEqual({
       log: ['error: message', 'stack'],
       respondWith: {
         error: 'error',
         message: 'message',
         timestamp: 'ts',
         stack: 'stack',
         statusCode: 500
       }
     });
   });
});
