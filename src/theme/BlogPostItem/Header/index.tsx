import React, {type ReactNode} from 'react';
import Header from '@theme-original/BlogPostItem/Header';
import type HeaderType from '@theme/BlogPostItem/Header';
import type {WrapperProps} from '@docusaurus/types';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';

type Props = WrapperProps<typeof HeaderType>;

export default function HeaderWrapper(props: Props): ReactNode {
  const {metadata, isBlogPostPage} = useBlogPost();
  const emoji = metadata.frontMatter.emoji as string | undefined;

  return (
    <>
      {emoji && (
        <div
          style={{
            fontSize: isBlogPostPage ? '6rem' : '4rem',
            textAlign: 'center',
            marginBottom: '1rem',
            lineHeight: 1,
          }}>
          {emoji}
        </div>
      )}
      <Header {...props} />
    </>
  );
}
