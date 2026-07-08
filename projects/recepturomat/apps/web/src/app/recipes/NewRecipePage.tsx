import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Section } from '@ksojecki/platform-ui';
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
  instructions: [],
  name: '',
  recipeId: '',
};

export function NewRecipePage() {
  const { t } = useTranslation('recipes');
  const { status } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { recipes } = useRecipesList({
    enabled: status === 'authenticated',
  });

  if (status === 'loading') {
    return (
      <Section
        className="mx-auto max-w-5xl"
        description={t('form.loadingDescription')}
        title={t('loading')}
      >
        <div className="flex items-center gap-2 text-sm text-base-content/70">
          <span className="loading loading-spinner loading-sm" />
          {t('form.loadingHint')}
        </div>
      </Section>
    );
  }

  if (status === 'guest') {
    return <RecipeAccessPrompt />;
  }

  return (
    <section className="mx-auto max-w-5xl">
      <RecipeForm
        initialRecipe={emptyRecipe}
        isSubmitting={isSubmitting}
        onCancel={() => {
          void navigate(-1);
        }}
        onSubmit={async (recipe) => {
          setIsSubmitting(true);

          try {
            const createdRecipe = await createRecipe(recipe);
            await navigate(buildRecipeDetailPath(createdRecipe.recipeId));
          } finally {
            setIsSubmitting(false);
          }
        }}
        recipes={recipes}
        title={t('form.titleNew')}
      />
    </section>
  );
}

export default NewRecipePage;
