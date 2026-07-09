import { Card, Paragraph, Section } from '@ksojecki/platform-ui';
import {
  createEmptyIngredient,
  createEmptyInstruction,
  isEditableRecipeUnit,
  type EditableRecipe,
  type EditableRecipeIngredient,
} from './RecipeForm.model';

interface RecipeInstructionsSectionProps {
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
          <div className="rounded-box border border-dashed border-base-300 bg-base-200/60 p-4">
            <Paragraph tone="muted">{t('form.emptyInstructions')}</Paragraph>
          </div>
        ) : null}

        {instructions.map((instruction, index) => (
          <Card
            className="border border-base-200 bg-linear-to-br from-base-100 to-base-200/40 shadow-none"
            key={`instruction-${index}`}
            title={`${t('form.instructionCardTitle')} ${index + 1}`}
          >
            <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-base-300 bg-base-200 text-sm font-semibold">
                {index + 1}
              </div>
              <div className="grid gap-3">
                <textarea
                  className="textarea textarea-bordered min-h-24 w-full"
                  onChange={(event) => {
                    onUpdateInstruction(index, event.target.value);
                  }}
                  placeholder={t('form.instructionPlaceholder')}
                  value={instruction}
                />
                <div className="flex justify-end">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      onRemoveInstruction(index);
                    }}
                    type="button"
                  >
                    {t('form.removeInstruction')}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

interface RecipeIngredientsSectionProps {
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
          <div className="rounded-box border border-dashed border-base-300 bg-base-200/60 p-4">
            <Paragraph tone="muted">{t('form.emptyIngredients')}</Paragraph>
          </div>
        ) : null}

        {ingredients.map((ingredient, index) => (
          <Card
            className={`border shadow-none ${
              ingredient.recipeId !== undefined
                ? 'border-base-300 bg-base-200/50'
                : 'border-base-200 bg-base-100'
            }`}
            key={ingredient.id}
            title={`${t('form.ingredientCardTitle')} ${index + 1}`}
          >
            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
                <label className="form-control">
                  <span className="label-text">{t('form.ingredientName')}</span>
                  <input
                    className="input input-bordered"
                    onChange={(event) => {
                      onUpdateIngredient(index, {
                        ...ingredient,
                        name: event.target.value,
                      });
                    }}
                    type="text"
                    value={ingredient.name}
                  />
                </label>

                <label className="form-control">
                  <span className="label-text">{t('form.amount')}</span>
                  <input
                    className="input input-bordered"
                    min="0"
                    onChange={(event) => {
                      onUpdateIngredient(index, {
                        ...ingredient,
                        amount: event.target.value,
                      });
                    }}
                    step="0.01"
                    type="number"
                    value={ingredient.amount}
                  />
                </label>

                <label className="form-control">
                  <span className="label-text">{t('form.unit')}</span>
                  <select
                    className="select select-bordered"
                    onChange={(event) => {
                      const unit = event.currentTarget.value;

                      onUpdateIngredient(index, {
                        ...ingredient,
                        unit: isEditableRecipeUnit(unit) ? unit : '',
                      });
                    }}
                    value={ingredient.unit}
                  >
                    <option value="">{t('form.selectUnit')}</option>
                    <option value="g">{t('units.g')}</option>
                    <option value="ml">{t('units.ml')}</option>
                    <option value="pcs">{t('units.pcs')}</option>
                  </select>
                </label>
              </div>

              <label className="form-control">
                <span className="label-text">{t('form.ingredientRecipeId')}</span>
                <input
                  className="input input-bordered"
                  list={`recipe-references-${index}`}
                  onChange={(event) => {
                    onUpdateIngredient(index, {
                      ...ingredient,
                      recipeId:
                        event.target.value.trim().length === 0 ? undefined : event.target.value,
                    });
                  }}
                  type="text"
                  value={ingredient.recipeId ?? ''}
                />
                <datalist id={`recipe-references-${index}`}>
                  {availableRecipeReferences.map((candidate) => (
                    <option key={candidate.recipeId} value={candidate.recipeId}>
                      {candidate.name}
                    </option>
                  ))}
                </datalist>
              </label>

              <div className="flex justify-end">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    onRemoveIngredient(index);
                  }}
                  type="button"
                >
                  {t('form.removeIngredient')}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export const recipeFormInitializers = {
  createEmptyIngredient,
  createEmptyInstruction,
};
