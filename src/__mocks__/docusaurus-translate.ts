import React from 'react';

export const translate = ({ message, id }: any) => message || id || '';
export default function Translate({ children }: any): any {
  return children;
}
