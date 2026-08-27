import { NextRequest, NextResponse } from 'next/server';
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { docsContentRoute, docsRoute } from '@/lib/shared';

const { rewrite: rewriteDocs } = rewritePath(
  `${docsRoute}{/*path}`,
  `${docsContentRoute}{/*path}/content.md`,
);
const { rewrite: rewriteSuffix } = rewritePath(
  `${docsRoute}{/*path}.md`,
  `${docsContentRoute}{/*path}/content.md`,
);

export default function proxy(request: NextRequest) {
  // Keep source-friendly Markdown links working while sending visitors to the
  // rendered docs page instead of the raw Markdown content endpoint.
  const docsFilePath = request.nextUrl.pathname.match(/^\/docs\/([^/]+)\.mdx?$/);
  if (docsFilePath) {
    const url = request.nextUrl.clone();
    url.pathname = `${docsRoute}/${docsFilePath[1]}`;
    return NextResponse.rewrite(url);
  }

  const rootDoc = request.nextUrl.pathname.match(/^\/([^/.]+)$/);
  if (rootDoc && !['api', 'docs', 'og'].includes(rootDoc[1])) {
    const url = request.nextUrl.clone();
    url.pathname = `${docsRoute}/${rootDoc[1]}`;
    return NextResponse.rewrite(url);
  }

  const legacyRootDoc = request.nextUrl.pathname.match(/^\/([^/]+)\.mdx?$/);
  if (legacyRootDoc) {
    const url = request.nextUrl.clone();
    url.pathname = `${docsRoute}/${legacyRootDoc[1]}`;
    return NextResponse.redirect(url, 308);
  }

  const result = rewriteSuffix(request.nextUrl.pathname);
  if (result) {
    return NextResponse.rewrite(new URL(result, request.nextUrl));
  }

  if (isMarkdownPreferred(request)) {
    const result = rewriteDocs(request.nextUrl.pathname);

    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl));
    }
  }

  return NextResponse.next();
}
