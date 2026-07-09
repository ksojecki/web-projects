import { Card } from '@ksojecki/platform-ui';
import { isEditableRecipeUnit, type EditableRecipe, type EditableRecipeIngredient } from './model';

export interface RecipeFormIngredientCardProps {
  availableRecipeReferences: Array<Pick<EditableRecipe, 'recipeId' | 'name'>>;
  index: number;
  ingredient: EditableRecipeIngredient;
  onRemoveIngredient: (index: number) => void;
  onUpdateIngredient: (index: number, nextIngredient: EditableRecipeIngredient) => void;
  t: (key: string) => string;
}

export function RecipeFormIngredientCard({
  availableRecipeReferences,
  index,
  ingredient,
  onRemoveIngredient,
  onUpdateIngredient,
  t,
}: RecipeFormIngredientCardProps) {
  return (
    <Card
      className={`border shadow-none ${
        ingredient.recipeId !== undefined
          ? 'border-base-300 bg-base-200/50'
          : 'border-base-200 bg-base-100'
      }`}
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
                recipeId: event.target.value.trim().length === 0 ? undefined : event.target.value,
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
  );
}
