import type { ReactElement, ReactNode } from 'react';
import { Heading } from '../Typography';
import type { ActionButtonProps } from './ActionButton';

export type ActionButtonType = ReactElement<ActionButtonProps>;

export type ContentProps = { children: string | ReactNode };
export type TitleProps = { children: string };
export type ActionsProps = {
  children?: ActionButtonType[] | ActionButtonType | null;
};

export type TitleType = ReactElement<ContentProps>;
export type ContentType = ReactElement<TitleProps>;
export type ActionType = ReactElement<ActionsProps>;

export const Title = ({ children }: TitleProps): TitleType => (
  <Heading level={3}>{children}</Heading>
);

export const Content = ({ children }: ContentProps): ContentType => {
  return <div className="py-4">{children}</div>;
};

export const Actions = ({ children }: ActionsProps): ActionType => {
  return <>{children}</>;
};
