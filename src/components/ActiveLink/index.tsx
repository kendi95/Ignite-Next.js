import Link, { LinkProps } from "next/link";
import { useRouter } from "next/router";
import { FC, cloneElement, ReactElement } from "react";

interface ActiveLinkProps extends LinkProps {
  activeClass: string;
  children: ReactElement
}

export const ActiveLink: FC<ActiveLinkProps> = ({ 
  children,
  activeClass,
  ...rest
 }) => {
  const { asPath } = useRouter(); 

  const className = asPath === rest.href ? activeClass : '';

  return (
    <Link {...rest}>
      {cloneElement(children, {
        className
      }) }
    </Link>
  );
}