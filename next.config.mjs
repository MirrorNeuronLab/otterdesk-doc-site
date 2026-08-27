import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
};

export default withMDX({
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
