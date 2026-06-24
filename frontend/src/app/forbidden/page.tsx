import { ErrorPage } from '@/components/errors/error-page';

export default function ForbiddenPage() {
  return <ErrorPage variant="unauthorized" showLogin={false} />;
}
