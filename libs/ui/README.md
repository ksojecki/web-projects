# @ksojecki/platform-ui

Shared React UI components for reuse across applications in this workspace.

Component names should stay free of the `Ui` prefix. Prefer names like `Button`, `Card`, and `TextInput`.

## Available components

- `Button`
- `Card`

## Example

```tsx
import { Button, Card } from '@ksojecki/platform-ui';

export function ExamplePanel() {
  return (
    <Card actions={<Button tone="primary">Save</Button>} title="Reusable panel">
      Shared content goes here.
    </Card>
  );
}
```

## Verification

```sh
npx nx test @ksojecki/platform-ui --no-tui
npx nx build @ksojecki/platform-ui --no-tui
npx nx typecheck @ksojecki/platform-ui --no-tui
```
