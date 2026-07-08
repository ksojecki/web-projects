import type { ButtonProps } from '../Button';
import { Button } from '../Button';
import type { To } from 'react-router';
import { useNavigate } from 'react-router';

export type ActionButtonProps = Omit<ButtonProps, 'type'> & {
  to?: To;
};

type WithNavigationProps = ActionButtonProps & {
  to: To;
};

export const ActionButton = ({ to, ...props }: ActionButtonProps) => {
  return to ? <ButtonWithNavigation {...props} to={to} /> : <Button {...props} type={'submit'} />;
};

const ButtonWithNavigation = ({ to, ...props }: WithNavigationProps) => {
  const navigate = useNavigate();
  const goToUrl = () => {
    void navigate(to);
  };
  return <Button {...props} type={'submit'} onClick={goToUrl} />;
};
