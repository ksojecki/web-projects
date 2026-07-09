import { Section } from '@ksojecki/platform-ui';
import type { EditableRecipe, EditableRecipeIngredient } from './model';
import { createEmptyIngredient } from './model';
import { RecipeFormIngredientCard } from './ingredientCard';
import { RecipeFormSectionEmptyState } from './sectionEmptyState';

export interface RecipeIngredientsSectionProps {
  availableRecipeReferences: Array<Pick<EditableRecipe, 'recipeId' | 'name'>>;
  ingredients: EditableRecipeIngredient[];
  onAddIngredient: () => void;
  onRemoveIngredient: (index: number) => void;
  onUpdateIngredient: (index: number, nextIngredient: EditableRecipeIngredient) => void;
  t: (key: string) => string;
}

export function RecipeIngredientsSection({
  availableRecipeReferences,
  ingredients,
  onAddIngredient,
  onRemoveIngredient,
  onUpdateIngredient,
  t,
}: RecipeIngredientsSectionProps) {
  return (
    <Section
      actions={
        <button className="btn btn-outline btn-sm" onClick={onAddIngredient} type="button">
          {t('form.addIngredient')}
        </button>
      }
      description={t('form.ingredientsDescription')}
      title={t('form.ingredients')}
    >
      <div className="grid gap-4">
        {ingredients.length === 0 ? (
          <RecipeFormSectionEmptyState message={t('form.emptyIngredients')} />
        ) : null}

        {ingredients.map((ingredient, index) => (
          <RecipeFormIngredientCard
            availableRecipeReferences={availableRecipeReferences}
            index={index}
            ingredient={ingredient}
            key={ingredient.id}
            onRemoveIngredient={onRemoveIngredient}
            onUpdateIngredient={onUpdateIngredient}
            t={t}
          />
        ))}
      </div>
    </Section>
  );
}

export const recipeFormIngredientInitializers = {
  createEmptyIngredient,
};
