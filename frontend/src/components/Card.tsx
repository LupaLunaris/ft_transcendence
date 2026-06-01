import type { PropsWithChildren } from 'react';

type CardProps = PropsWithChildren<{
  title?: string;
}>;

export default function Card({ children, title }: CardProps) {
  return (
    <section>
      {title ? <h1>{title}</h1> : null}
      {children}
    </section>
  );
}
