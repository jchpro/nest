import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject, SwaggerDocumentOptions } from '@nestjs/swagger';
import { SwaggerUiOptions } from '../types/swagger-ui.options';
import { SwaggerModule } from '../internal/swagger';

class SwaggerUi {

  constructor(
    private readonly app: INestApplication,
    readonly openapiDoc: OpenAPIObject
  ) {}

  /**
   * Sets up the Swagger UI server, optionally with the JSON document served at a separate endpoint.
   */
  serve(path: string, options?: SwaggerUiOptions) {
    const effectivePath = path.replace(/^\/+/, '');
    SwaggerModule.setup(effectivePath, this.app, this.openapiDoc);
    if (options?.serveDoc) {
      const docPath = `/${effectivePath}/${options?.docPath ?? 'doc.json'}`;
      const server = this.app.getHttpAdapter();
      server.use(docPath, (req: any, res: { json(json: any): void }) => {
        res.json(this.openapiDoc);
      });
    }
  }

}

export type { SwaggerUi };

export const SwaggerUiFactory = {

  /**
   * Call inside the `bootstrap` function of your Nest.js app.
   */
  create: function(
    app: INestApplication,
    config: Omit<OpenAPIObject, 'paths'>,
    options?: SwaggerDocumentOptions,
  ): SwaggerUi {
    return new SwaggerUi(app, SwaggerModule.createDocument(app, config, options));
  }

}
