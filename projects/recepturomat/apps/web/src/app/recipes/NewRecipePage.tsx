import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useAuth } from '@ksojecki/platform-web-platform';
import { buildRecipeDetailPath } from '../productConfig';
import { createRecipe } from './api';
import { RecipeAccessPrompt } from './RecipeAccessPrompt';
import { RecipeForm } from './RecipeForm';
import { useRecipesList } from './useRecipesList';
import type { Recipe } from './types';

const emptyRecipe: Recipe = {
  defaultWeight: 1000,
  ingredients: [],
  name: '',
  recipeId: 'new',
};

export function NewRecipePage() {
  const { t } = useTranslation('recipes');
  const { status } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { recipes } = useRecipesList({
    enabled: status === 'authenticated',
  });

  if (status === 'loading') {
    return <p>{t('loading')}</p>;
  }

  if (status === 'guest') {
    return <RecipeAccessPrompt />;
  }

  return (
    <section className="mx-auto max-w-4xl">
      <RecipeForm
        initialRecipe={emptyRecipe}
        isSubmitting={isSubmitting}
        onCancel={() => {
          void navigate(-1);
        }}
        onSubmit={async (recipe) => {
          setIsSubmitting(true);
          setSubmitError(null);

          try {
            const createdRecipe = await createRecipe(recipe);
            await navigate(buildRecipeDetailPath(createdRecipe.recipeId));
          } catch (caughtError) {
            setSubmitError(
              caughtError instanceof Error
                ? caughtError.message
                : t('errors.submitFailed'),
            );
          } finally {
            setIsSubmitting(false);
          }
        }}
        recipes={recipes}
        submitError={submitError}
        title={t('form.titleNew')}
      />
    </section>
  );
}

export default NewRecipePage;
