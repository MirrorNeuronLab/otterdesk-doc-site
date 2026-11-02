import { createMDX } from 'fumadocs-mdx/next';
import { legacyDocRoutes } from './lib/legacy-routes.mjs';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
};

export default withMDX({
  ...config,
  async redirects() {
    return Object.entries(legacyDocRoutes).flatMap(([oldSlug, newSlug]) => {
      const destination = `/docs${newSlug ? `/${newSlug}` : ''}`;
      return [
        ...['', '.md', '.mdx'].flatMap((suffix) => [
          { source: `/docs/${oldSlug}${suffix}`, destination, permanent: true },
          { source: `/${oldSlug}${suffix}`, destination, permanent: true },
        ]),
        {
          source: `/llms.mdx/docs/${oldSlug}/content.md`,
          destination: `/llms.mdx/docs${newSlug ? `/${newSlug}` : ''}/content.md`,
          permanent: true,
        },
        {
          source: `/og/docs/${oldSlug}/image.png`,
          destination: `/og/docs${newSlug ? `/${newSlug}` : ''}/image.png`,
          permanent: true,
        },
      ];
    });
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          destination: '/docs',
        },
      ],
    };
  },
});
