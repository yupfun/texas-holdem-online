const config = {
  isProduction: import.meta.env.PROD,
  contentfulSpaceId: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
  contentfulAccessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
  // Dev: use Vite proxy (same origin) - set VITE_SOCKET_URI=http://localhost:7777 to bypass
  socketURI:
    import.meta.env.VITE_SOCKET_URI ||
    (import.meta.env.PROD
      ? import.meta.env.VITE_SERVER_URI
      : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')),
  apiBaseUrl:
    import.meta.env.PROD
      ? import.meta.env.VITE_SERVER_URI
      : '',
};

export default config;
