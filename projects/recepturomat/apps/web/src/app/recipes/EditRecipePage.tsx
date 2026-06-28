import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@ksojecki/platform-web-platform';
import { buildRecipeDetailPath } from '../productConfig';
import { RecipeAccessPrompt } from './RecipeAccessPrompt';
import { RecipeForm } from './RecipeForm';
import { updateRecipe } from './api';
import { useRecipe } from './useRecipe';
import { useRecipesList } from './useRecipesList';

export function EditRecipePage() {
  const { t } = useTranslation('recipes');
  const { status } = useAuth();
  const navigate = useNavigate();
  const { recipeId } = useParams<{ recipeId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { error, isLoading, recipe } = useRecipe({
    enabled: status === 'authenticated',
    recipeId,
  });
  const { recipes } = useRecipesList({
    enabled: status === 'authenticated',
  });

  if (status === 'loading') {
    return <p>{t('loading')}</p>;
  }

  if (status === 'guest') {
    return <RecipeAccessPrompt />;
  }

  if (recipeId === undefined) {
    return (
      <p className="alert alert-error" role="alert">
        {t('detail.missingRecipeId')}
      </p>
    );
  }

  if (error !== null) {
    return (
      <p className="alert alert-error" role="alert">
        {error.message}
      </p>
    );
  }

  if (isLoading || recipe === null) {
    return <p>{t('loading')}</p>;
  }

  return (
    <section className="mx-auto max-w-4xl">
      <RecipeForm
        initialRecipe={recipe}
        isSubmitting={isSubmitting}
        onCancel={() => {
          void navigate(buildRecipeDetailPath(recipeId));
        }}
        onSubmit={async (nextRecipe) => {
          setIsSubmitting(true);
          setSubmitError(null);

          try {
            await updateRecipe(recipeId, nextRecipe);
            await navigate(buildRecipeDetailPath(recipeId));
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
        title={t('form.titleEdit')}
      />
    </section>
  );
}

export default EditRecipePage;
