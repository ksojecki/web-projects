import { useEffect, useState } from 'react';
import { listCategories, type Category } from './budgetApi';
import { EmptyState, ErrorState, LoadingState, PageFrame, Section } from './components';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState(false);
  const load = () => {
    setError(false);
    void listCategories()
      .then(setCategories)
      .catch(() => setError(true));
  };
  useEffect(load, []);
  const grouped = (categories ?? []).reduce<Map<string, Category[]>>((result, category) => {
    const list = result.get(category.category) ?? [];
    list.push(category);
    result.set(category.category, list);
    return result;
  }, new Map());
  return (
    <PageFrame
      eyebrow="Settings"
      title="Categories"
      description="The imported category dictionary is read-only in this first delivery."
    >
      {error ? (
        <ErrorState onRetry={load} />
      ) : categories === null ? (
        <LoadingState />
      ) : (
        <Section title="Category dictionary">
          {categories.length === 0 ? (
            <EmptyState>No categories available.</EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from(grouped.entries()).map(([name, items]) => (
                <article className="rounded-box border border-base-200 p-4" key={name}>
                  <h2 className="font-semibold">{name}</h2>
                  <ul className="mt-3 space-y-2">
                    {items.map((category) => (
                      <li
                        className="flex items-center justify-between gap-3 text-sm"
                        key={category.id}
                      >
                        <span className="text-base-content/75">{category.subcategory}</span>
                        {category.group ? (
                          <span className="badge badge-ghost badge-sm">{category.group}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </Section>
      )}
    </PageFrame>
  );
}
