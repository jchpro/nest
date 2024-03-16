export interface MigrateConfig {
  default?: string;
  projects: Record<string, MigrateProject>;
}

export interface MigrateProject {
  collector: string;
  directory: string;
}
