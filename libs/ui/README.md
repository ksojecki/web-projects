# @sojecki/platform-ui

Shared React UI components for reuse across applications in this workspace.

Component names should stay free of the `Ui` prefix. Prefer names like `Button`, `Card`, and `TextInput`.

## Available components

- `Button`
- `Card`

## Example

```tsx
import { Button, Card } from '@sojecki/platform-ui';

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
npx nx test @sojecki/platform-ui --no-tui
npx nx build @sojecki/platform-ui --no-tui
npx nx typecheck @sojecki/platform-ui --no-tui
```
