type AppScreenshotProps = {
  src: string;
  alt: string;
  caption: string;
};

export function AppScreenshot({ src, alt, caption }: AppScreenshotProps) {
  return (
    <figure className="app-screenshot">
      <a href={src} target="_blank" rel="noreferrer" aria-label={`Open full-size screenshot: ${alt}`}>
        <img src={src} alt={alt} width={1440} height={960} loading="lazy" />
      </a>
      <figcaption>{caption} <span>Demonstration data. Open the image for a full-size view.</span></figcaption>
    </figure>
  );
}
