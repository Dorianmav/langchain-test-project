/**
 * Interface pour un template personnalisé
 */
export interface CustomTemplate {
  name: string;
  content: string;
  description: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}
