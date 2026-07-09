import { Paragraph } from '@ksojecki/platform-ui';

export interface RecipeFormSectionEmptyStateProps {
  message: string;
}

export function RecipeFormSectionEmptyState({ message }: RecipeFormSectionEmptyStateProps) {
  return (
    <div className="rounded-box border border-dashed border-base-300 bg-base-200/60 p-4">
      <Paragraph tone="muted">{message}</Paragraph>
    </div>
  );
}
