import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

export const ErrorPage = () => {
  const error = useRouteError();

  let title = 'Something went wrong';
  let description = 'The application encountered an unexpected error.';
  let status: number | null = null;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (status === 404) {
      title = 'Page not found';
      description = 'We couldn’t find the page you requested.';
    } else {
      title = `${error.status} ${error.statusText}`;
      let message = description;
      if (
        typeof error.data === 'object' &&
        error.data !== null &&
        'message' in error.data
      ) {
        message = (error.data as { message?: string }).message ?? description;
      }
      description = message;
    }
  } else if (error instanceof Error) {
    description = error.message || description;
  }

  return (
    <div role="alert" style={{ padding: 24 }}>
      <h1>{title}</h1>
      <p>{description}</p>
      <div style={{ marginTop: 16 }}>
        <Link to="/">Go back home</Link>
      </div>
      {process.env.NODE_ENV !== 'production' && error instanceof Error && (
        <pre
          style={{ marginTop: 16, color: '#b00020', whiteSpace: 'pre-wrap' }}
        >
          {error.stack}
        </pre>
      )}
    </div>
  );
};
