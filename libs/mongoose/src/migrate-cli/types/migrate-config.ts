export interface MigrateConfig {
  default?: string;
  root?: MigrateProject;
  projects?: Record<string, MigrateProject>;
}

export interface MigrateProject {
  collector: string;
  directory: string;
}
