import { Card, Paragraph } from '@ksojecki/platform-ui';

export interface RecipeFormInstructionCardProps {
  index: number;
  instruction: string;
  onRemoveInstruction: (index: number) => void;
  onUpdateInstruction: (index: number, nextInstruction: string) => void;
  t: (key: string) => string;
}

export function RecipeFormInstructionCard({
  index,
  instruction,
  onRemoveInstruction,
  onUpdateInstruction,
  t,
}: RecipeFormInstructionCardProps) {
  return (
    <Card
      className="border border-base-200 bg-linear-to-br from-base-100 to-base-200/40 shadow-none"
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
      {instruction.length === 0 ? (
        <Paragraph className="mt-3" tone="muted">
          {t('form.instructionPlaceholder')}
        </Paragraph>
      ) : null}
    </Card>
  );
}
