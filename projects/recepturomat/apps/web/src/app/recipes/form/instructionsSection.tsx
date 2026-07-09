import { Section } from '@ksojecki/platform-ui';
import { createEmptyInstruction } from './model';
import { RecipeFormInstructionCard } from './instructionCard';
import { RecipeFormSectionEmptyState } from './sectionEmptyState';

export interface RecipeInstructionsSectionProps {
  instructions: string[];
  onAddInstruction: () => void;
  onRemoveInstruction: (index: number) => void;
  onUpdateInstruction: (index: number, nextInstruction: string) => void;
  t: (key: string) => string;
}

export function RecipeInstructionsSection({
  instructions,
  onAddInstruction,
  onRemoveInstruction,
  onUpdateInstruction,
  t,
}: RecipeInstructionsSectionProps) {
  return (
    <Section
      actions={
        <button className="btn btn-outline btn-sm" onClick={onAddInstruction} type="button">
          {t('form.addInstruction')}
        </button>
      }
      description={t('form.instructionsDescription')}
      title={t('form.instructions')}
    >
      <div className="grid gap-4">
        {instructions.length === 0 ? (
          <RecipeFormSectionEmptyState message={t('form.emptyInstructions')} />
        ) : null}

        {instructions.map((instruction, index) => (
          <RecipeFormInstructionCard
            index={index}
            instruction={instruction}
            key={`instruction-${index}`}
            onRemoveInstruction={onRemoveInstruction}
            onUpdateInstruction={onUpdateInstruction}
            t={t}
          />
        ))}
      </div>
    </Section>
  );
}

export const recipeFormInstructionInitializers = {
  createEmptyInstruction,
};
