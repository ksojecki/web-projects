import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { Section } from '@ksojecki/platform-ui';
import { useAuth } from '@ksojecki/platform-web-platform';
import { buildRecipeDetailPath } from '../productConfig';
import { RecipeAccessPrompt } from './RecipeAccessPrompt';
import { RecipeForm } from './form';
import { updateRecipe } from './api';
import { useRecipe } from './useRecipe';
import { useRecipesList } from './useRecipesList';

export function EditRecipePage() {
  const { t } = useTranslation('recipes');
  const { status } = useAuth();
  const navigate = useNavigate();
  const { recipeId } = useParams<{ recipeId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error, isLoading, recipe } = useRecipe({
    enabled: status === 'authenticated',
    recipeId,
  });
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

  if (recipeId === undefined) {
    return (
      <Section className="mx-auto max-w-5xl" title={t('detail.invalidTitle')}>
        <p className="alert alert-error" role="alert">
          {t('detail.missingRecipeId')}
        </p>
      </Section>
    );
  }

  if (error !== null) {
    return (
      <Section className="mx-auto max-w-5xl" title={t('errors.loadFailed')}>
        <p className="alert alert-error" role="alert">
          {error.message}
        </p>
      </Section>
    );
  }

  if (isLoading || recipe === null) {
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

  return (
    <section className="mx-auto max-w-5xl">
      <RecipeForm
        initialRecipe={recipe}
        isSubmitting={isSubmitting}
        onCancel={() => {
          void navigate(buildRecipeDetailPath(recipeId));
        }}
        onSubmit={async (nextRecipe) => {
          setIsSubmitting(true);

          try {
            await updateRecipe(recipeId, nextRecipe);
            await navigate(buildRecipeDetailPath(recipeId));
          } finally {
            setIsSubmitting(false);
          }
        }}
        recipes={recipes}
        title={t('form.titleEdit')}
      />
    </section>
  );
}

export default EditRecipePage;
