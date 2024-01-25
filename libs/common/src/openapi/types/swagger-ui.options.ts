export interface SwaggerUiOptions {

  /**
   * Set if you want the specification document to be served as JSON alongside the UI.
   */
  serveDoc?: boolean;

  /**
   * What name should the served JSON specification file have, defaults to `doc.json`.
   */
  docPath?: string;
}
